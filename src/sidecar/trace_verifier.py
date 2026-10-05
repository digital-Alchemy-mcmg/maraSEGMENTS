from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from .b_sidecar import BSidecar, SidecarStage


@dataclass(frozen=True)
class TraceVerificationResult:
    verifier_id: str
    passed: bool
    verified_walk: str
    recomputed_sidecar_hash: str
    sidecar_source_hash: str
    envelope_scout_hash: str
    three_way_match: bool
    anchors_checked: int
    error_detail: Optional[str] = None


class B5IndependentTraceVerifier:
    """Independent B5-boundary verifier for source integrity and lineage continuity."""

    def __init__(self, verifier_id: str = "t06-trace-verifier-v3"):
        self.verifier_id = verifier_id

    def verify_trace(self, sidecar: BSidecar, expected_scout_hash: str,
                     b5_projection_anchors: List[str], b4_ledger: Dict[str, Any],
                     b2_tree: Dict[str, Any]) -> TraceVerificationResult:
        try:
            raw_text = sidecar.read_source_text(SidecarStage.B5_VERIFIER)
        except Exception as e:
            return TraceVerificationResult(self.verifier_id, False, "FAILED_AT_SIDECAR_READ", "",
                                           getattr(sidecar, "source_hash", ""), expected_scout_hash,
                                           False, 0, str(e))
        recomputed = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
        sidecar_hash = sidecar.source_hash
        three_way = recomputed == sidecar_hash == expected_scout_hash
        if not three_way:
            return TraceVerificationResult(self.verifier_id, False, "THREE_WAY_HASH_MISMATCH",
                                           recomputed, sidecar_hash, expected_scout_hash, False, 0,
                                           "recomputed_sidecar_hash != sidecar.source_hash != envelope scout hash")

        checked = 0
        for anchor in b5_projection_anchors:
            record = b4_ledger.get(anchor)
            node = b2_tree.get(anchor)
            if not record:
                return TraceVerificationResult(self.verifier_id, False, f"BROKEN_WALK_AT_B4({anchor})",
                                               recomputed, sidecar_hash, expected_scout_hash, True, checked,
                                               f"B5 anchor {anchor!r} missing from B4 ledger.")
            if not node:
                return TraceVerificationResult(self.verifier_id, False, f"BROKEN_WALK_AT_B2({anchor})",
                                               recomputed, sidecar_hash, expected_scout_hash, True, checked,
                                               f"B5 anchor {anchor!r} missing from B2 tree.")
            if record.get("disposition") == "PASS":
                if not record.get("atom_id") or not record.get("candidate_atom_integrity_verified"):
                    return TraceVerificationResult(self.verifier_id, False, f"BROKEN_WALK_AT_B3({anchor})",
                                                   recomputed, sidecar_hash, expected_scout_hash, True, checked,
                                                   "Admitted B4 record lacks verified B3 atom continuity.")
            trace = record.get("target_trace") or {}
            node_trace = node.get("source_trace") or {}
            if trace.get("tag_id") != node_trace.get("tag_id"):
                return TraceVerificationResult(self.verifier_id, False, f"BROKEN_TARGET_TRACE({anchor})",
                                               recomputed, sidecar_hash, expected_scout_hash, True, checked,
                                               "B4 target trace does not match frozen B2 trace.")
            start, end, excerpt = trace.get("span_start"), trace.get("span_end"), trace.get("source_excerpt")
            if trace.get("source_match"):
                if start is None or end is None or raw_text[start:end] != excerpt:
                    return TraceVerificationResult(self.verifier_id, False, f"BROKEN_SOURCE_SPAN({anchor})",
                                                   recomputed, sidecar_hash, expected_scout_hash, True, checked,
                                                   "B2/B4 source span does not reproduce from authoritative sidecar text.")
            checked += 1

        return TraceVerificationResult(
            self.verifier_id, True,
            "B5_DECISION -> B4_LEDGER -> B3_ATOM -> B2_TARGET_TRACE -> SIDECAR_SOURCE + THREE_WAY_HASH",
            recomputed, sidecar_hash, expected_scout_hash, True, checked, None,
        )
