from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict
from .b_sidecar import BSidecar
from .trace_verifier import TraceVerificationResult


class SidecarShredder:
    """Terminates the stationary sidecar and emits a truthful destruction attestation."""

    @staticmethod
    def shred_and_attest(sidecar: BSidecar, trace_result: TraceVerificationResult,
                         b2_frozen_tree_hash: str, b4_ledger_hash: str, tag_layer_hash: str) -> Dict[str, Any]:
        if not trace_result.passed or not trace_result.three_way_match:
            raise RuntimeError(f"Cannot terminate sidecar with verification failure: {trace_result.error_detail}")
        ts = datetime.now(timezone.utc).isoformat()
        sidecar_id, original_hash, created_at = sidecar.sidecar_id, sidecar.original_content_sha256, sidecar.created_at
        tags_purged_at = sidecar._tags_purged_at or ts
        sidecar.shred_memory(ts)
        if not sidecar.verify_destroyed():
            raise RuntimeError("Sidecar termination failed: owned live references remain reachable.")
        return {
            "sidecar_id": sidecar_id,
            "status": "TERMINATED_AND_VERIFIED",
            "lifecycle_metrics": {"created_at": created_at, "tags_purged_at": tags_purged_at, "destroyed_at": ts},
            "cryptographic_proofs": {
                "original_content_sha256": original_hash,
                "tag_layer_sha256": tag_layer_hash,
                "b2_frozen_tree_sha256": b2_frozen_tree_hash,
                "b4_lineage_ledger_sha256": b4_ledger_hash,
            },
            "b5_trace_verification": {
                "verifier_id": trace_result.verifier_id,
                "result": "PASSED",
                "verified_walk": trace_result.verified_walk,
                "hash_matched": trace_result.three_way_match,
                "three_way_match": trace_result.three_way_match,
                "recomputed_sidecar_hash": trace_result.recomputed_sidecar_hash,
                "anchors_checked": trace_result.anchors_checked,
            },
            "destruction_verification": {
                "method": "APPLICATION_REFERENCE_PURGE",
                "owned_references_unreachable": True,
                "physical_memory_zeroization_guaranteed": False,
                "scope": "Python process object graph only",
            },
        }
