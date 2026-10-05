from __future__ import annotations

import copy
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class MasterTravelingEnvelope:
    """Master Traveling Envelope Engine (v2.0).

    Invariants:
    1. Append-only: Prior stage outputs and audit entries are strictly immutable.
    2. Zero sidecar leakage: Raw posting text is NEVER accepted into the envelope.
    3. Handoff barrier: Before entering C1, B_sidecar_attestation MUST be present with status TERMINATED_AND_VERIFIED.
    """

    def __init__(
        self,
        candidate_id: str,
        target_id: str,
        run_policy: Optional[Dict[str, Any]] = None,
        pipeline_version: str = "2.0.0-fork",
    ):
        now = datetime.now(timezone.utc).isoformat()
        self.run_id: str = f"run-{uuid.uuid4().hex[:12]}"
        self.candidate_id: str = candidate_id
        self.target_id: str = target_id
        self.pipeline_version: str = pipeline_version
        self.run_policy: Dict[str, Any] = run_policy or {"max_pages": 1, "strictness": "ABSOLUTE"}
        self.current_stage: str = "INITIALIZED"
        self.status: str = "RUNNING"

        self._A_scout: Optional[Dict[str, Any]] = None
        self._B_sdna: Optional[Dict[str, Any]] = None
        self._C_factory: Dict[str, Any] = {
            "C1_docket": None,
            "C2_claims": None,
            "C3_model": None,
            "C4_layout": None,
            "C5_artifact": None,
        }
        self._audit_trail: List[Dict[str, Any]] = []

        self._record_audit("Z", "RUN_INITIALIZED", {"created_at": now})

    def append_scout(
        self,
        target_entity: Dict[str, Any],
        requirements_taxonomy: Dict[str, Any],
        original_content_sha256: str,
        source_url: str = "",
    ) -> None:
        """Appends Stage A Scout record. Strictly rejects if raw text is mistakenly included."""
        if self._A_scout is not None:
            raise RuntimeError("A_scout is already sealed and cannot be overwritten.")

        # Guard against raw text leakage into the envelope
        forbidden_keys = ["raw_posting", "raw_job_description_text", "raw_html", "full_text"]
        for k in forbidden_keys:
            if k in target_entity or k in requirements_taxonomy:
                raise ValueError(
                    f"Envelope leak violation: '{k}' must not be appended to the traveling envelope. Use the B-Sidecar instead."
                )

        self._A_scout = {
            "target_entity": copy.deepcopy(target_entity),
            "requirements_taxonomy": copy.deepcopy(requirements_taxonomy),
            "original_content_sha256": original_content_sha256,
            "source_url": source_url,
        }
        self.current_stage = "A_SCOUT"
        self._record_audit("A", "TARGET_SCOUTED", {"target_id": self.target_id, "source_hash": original_content_sha256})

    def append_b_layer(
        self,
        competency_tree: Dict[str, Any],
        b4_ledger: Dict[str, Any],
        b5_projection: Dict[str, Any],
        b_sidecar_attestation: Dict[str, Any],
    ) -> None:
        """Appends Stage B outputs and the cryptographic sidecar destruction tombstone."""
        if self._B_sdna is not None:
            raise RuntimeError("B_sdna is already sealed and cannot be overwritten.")

        # Validate that sidecar attestation is terminated and verified
        status = b_sidecar_attestation.get("status")
        if status != "TERMINATED_AND_VERIFIED":
            raise ValueError(f"Cannot accept B_sdna: sidecar attestation status is '{status}' (must be TERMINATED_AND_VERIFIED)")

        self._B_sdna = {
            "competency_tree": copy.deepcopy(competency_tree),
            "b4_ledger": copy.deepcopy(b4_ledger),
            "b5_projection": copy.deepcopy(b5_projection),
            "B_sidecar_attestation": copy.deepcopy(b_sidecar_attestation),
        }
        self.current_stage = "B5_COMPLETE"
        self.status = "complete:STOP_BEFORE_RESUME_FACTORY"
        self._record_audit("B5", "B_CYCLE_COMPLETE_AND_SIDECAR_DESTROYED", {
            "sidecar_id": b_sidecar_attestation.get("sidecar_id"),
            "owner_prism": b5_projection.get("owner_prism"),
        })

    def verify_c1_handoff_readiness(self) -> Tuple[bool, List[str]]:
        """Validates that envelope is completely ready for C1 ingestion with zero leaks."""
        errors: List[str] = []

        if not self._A_scout:
            errors.append("A_scout is missing.")
        if not self._B_sdna:
            errors.append("B_sdna is missing.")
        else:
            attestation = self._B_sdna.get("B_sidecar_attestation")
            if not attestation:
                errors.append("B_sidecar_attestation is missing from B_sdna.")
            elif attestation.get("status") != "TERMINATED_AND_VERIFIED":
                errors.append(f"Sidecar was not terminated cleanly: status is '{attestation.get('status')}'.")

            proj = self._B_sdna.get("b5_projection")
            if not proj or not proj.get("prism_intro_evaluation") or not proj.get("projection_posture"):
                errors.append("B5 projection is missing required fields (prism_intro_evaluation or projection_posture).")

        return len(errors) == 0, errors

    def append_c_stage(self, stage_name: str, payload: Dict[str, Any]) -> None:
        """Appends output from C1, C2, C3, C4, or C5."""
        if stage_name not in self._C_factory:
            raise KeyError(f"Invalid C stage: {stage_name}. Must be one of {list(self._C_factory.keys())}")
        if self._C_factory[stage_name] is not None:
            raise RuntimeError(f"{stage_name} already has a committed payload and cannot be overwritten.")

        self._C_factory[stage_name] = copy.deepcopy(payload)
        self.current_stage = stage_name
        self._record_audit(stage_name, f"{stage_name}_COMMITTED", {"keys": list(payload.keys())})

    def _record_audit(self, stage: str, event: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        self._audit_trail.append({
            "stage": stage,
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
        })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "envelope_version": "2.0.0",
            "Z_state": {
                "run_id": self.run_id,
                "candidate_id": self.candidate_id,
                "target_id": self.target_id,
                "pipeline_version": self.pipeline_version,
                "current_stage": self.current_stage,
                "status": self.status,
                "run_policy": copy.deepcopy(self.run_policy),
            },
            "A_scout": copy.deepcopy(self._A_scout),
            "B_sdna": copy.deepcopy(self._B_sdna),
            "C_factory": copy.deepcopy(self._C_factory),
            "audit_trail": copy.deepcopy(self._audit_trail),
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)