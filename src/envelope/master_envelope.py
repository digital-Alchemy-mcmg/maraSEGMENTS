from __future__ import annotations

import copy
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


class EnvelopeBoundaryError(ValueError):
    pass


class MissingEnvelopeInputError(EnvelopeBoundaryError):
    def __init__(self, missing_path: str, stage_name: str, detail: str = ""):
        self.missing_path = missing_path
        self.stage_name = stage_name
        self.detail = detail
        super().__init__(f"[{stage_name}] Missing required envelope path: '{missing_path}'. {detail}".strip())


class RunIdentityMismatchError(EnvelopeBoundaryError):
    pass


class MasterTravelingEnvelope:
    def __init__(self, candidate_id: str, target_id: str, run_policy: Optional[Dict[str, Any]] = None,
                 pipeline_version: str = "2.0.0-fork", run_id: Optional[str] = None):
        if not candidate_id or not candidate_id.strip():
            raise MissingEnvelopeInputError("Z_state.candidate_id", "INITIALIZATION", "candidate_id cannot be empty.")
        if not target_id or not target_id.strip():
            raise MissingEnvelopeInputError("Z_state.target_id", "INITIALIZATION", "target_id cannot be empty.")
        now = datetime.now(timezone.utc).isoformat()
        self.run_id = run_id or f"run-{uuid.uuid4().hex[:12]}"
        self.candidate_id = candidate_id.strip()
        self.target_id = target_id.strip()
        self.pipeline_version = pipeline_version
        self.run_policy = copy.deepcopy(run_policy) if run_policy is not None else {}
        self.current_stage = "INITIALIZED"
        self.status = "RUNNING"
        self._A_scout = None
        self._B_sdna = None
        self._C_factory = {"C1_docket":None,"C2_claims":None,"C3_model":None,"C4_layout":None,"C5_artifact":None}
        self._audit_trail: List[Dict[str, Any]] = []
        self._record_audit("Z","RUN_INITIALIZED",{"run_id":self.run_id,"candidate_id":self.candidate_id,"target_id":self.target_id,"pipeline_version":self.pipeline_version,"created_at":now})

    def validate_boundary(self, target_stage: str) -> None:
        missing=[]
        if target_stage in ["B1","B2","B3","B4","B5"]:
            if not self._A_scout: missing.append("A_scout")
            else:
                entity=self._A_scout.get("target_entity",{})
                if not entity.get("company_name"): missing.append("A_scout.target_entity.company_name")
                if not entity.get("job_title"): missing.append("A_scout.target_entity.job_title")
                taxonomy=self._A_scout.get("requirements_taxonomy",{})
                if not taxonomy.get("hard_requirements"): missing.append("A_scout.requirements_taxonomy.hard_requirements")
                if not self._A_scout.get("original_content_sha256"): missing.append("A_scout.original_content_sha256")
        if target_stage.startswith("C"):
            if not self._A_scout: missing.append("A_scout")
            if not self._B_sdna: missing.append("B_sdna")
            else:
                att=self._B_sdna.get("B_sidecar_attestation")
                if not att or att.get("status")!="TERMINATED_AND_VERIFIED": missing.append("B_sdna.B_sidecar_attestation")
                b4=self._B_sdna.get("b4_ledger",{})
                if not b4.get("admitted_bindings"): missing.append("B_sdna.b4_ledger.admitted_bindings")
                if not b4.get("candidate_identity"): missing.append("B_sdna.b4_ledger.candidate_identity")
                b5=self._B_sdna.get("b5_projection",{})
                if not b5.get("owner_prism"): missing.append("B_sdna.b5_projection.owner_prism")
                if not b5.get("projection_posture"): missing.append("B_sdna.b5_projection.projection_posture")
        if missing:
            self._record_audit(target_stage,"BOUNDARY_VALIDATION_FAILED",{"missing_paths":missing})
            raise MissingEnvelopeInputError(missing[0],target_stage,f"All missing: {missing}")

    def append_scout(self, target_entity: Dict[str, Any], requirements_taxonomy: Dict[str, Any],
                     original_content_sha256: str, source_url: str = "") -> None:
        if self._A_scout is not None:
            raise RuntimeError("A_scout is already sealed and cannot be overwritten.")
        leakage_candidates=["raw_text","raw_posting","raw_job_description_text","full_description","raw_html","posting_body"]
        for key in list(target_entity.keys())+list(requirements_taxonomy.keys()):
            if any(leak in key.lower() for leak in leakage_candidates):
                raise ValueError(f"SECURITY FAULT: Raw target text detected in key '{key}'.")
        if not target_entity.get("company_name"):
            raise MissingEnvelopeInputError("target_entity.company_name","A_SCOUT")
        if not original_content_sha256:
            raise MissingEnvelopeInputError("original_content_sha256","A_SCOUT")
        self._A_scout={"target_entity":copy.deepcopy(target_entity),"requirements_taxonomy":copy.deepcopy(requirements_taxonomy),"original_content_sha256":original_content_sha256,"source_url":source_url}
        self.current_stage="A_SCOUT"
        self._record_audit("A_SCOUT","A_SCOUT_COMMITTED",{"company_name":target_entity.get("company_name"),"job_title":target_entity.get("job_title"),"content_hash":original_content_sha256})

    def append_b_layer(self, competency_tree: Dict[str, Any], b4_ledger: Dict[str, Any],
                       b5_projection: Dict[str, Any], b_sidecar_attestation: Dict[str, Any]) -> None:
        if self._B_sdna is not None:
            raise RuntimeError("B_sdna is already sealed and cannot be overwritten.")
        if not b_sidecar_attestation or b_sidecar_attestation.get("status")!="TERMINATED_AND_VERIFIED":
            raise EnvelopeBoundaryError("B_sidecar_attestation missing or not TERMINATED_AND_VERIFIED.")
        self._B_sdna={"competency_tree":copy.deepcopy(competency_tree),"b4_ledger":copy.deepcopy(b4_ledger),"b5_projection":copy.deepcopy(b5_projection),"B_sidecar_attestation":copy.deepcopy(b_sidecar_attestation)}
        self.current_stage="B5_COMPLETE"
        self.status="complete:STOP_BEFORE_RESUME_FACTORY"
        self._record_audit("B5","B_CYCLE_COMPLETE_AND_SIDECAR_DESTROYED",{"sidecar_id":b_sidecar_attestation.get("sidecar_id"),"owner_prism":b5_projection.get("owner_prism")})

    def verify_c1_handoff_readiness(self) -> Tuple[bool,List[str]]:
        errors=[]
        try: self.validate_boundary("C1")
        except Exception as e: errors.append(str(e))
        return (not errors,errors)

    def _record_audit(self, stage: str, event: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        self._audit_trail.append({"stage":stage,"event":event,"timestamp":datetime.now(timezone.utc).isoformat(),"metadata":metadata or {}})

    def to_dict(self) -> Dict[str, Any]:
        return {"envelope_version":"2.0.0","Z_state":{"run_id":self.run_id,"candidate_id":self.candidate_id,"target_id":self.target_id,"pipeline_version":self.pipeline_version,"current_stage":self.current_stage,"status":self.status,"run_policy":copy.deepcopy(self.run_policy)},"A_scout":copy.deepcopy(self._A_scout),"B_sdna":copy.deepcopy(self._B_sdna),"C_factory":copy.deepcopy(self._C_factory),"audit_trail":copy.deepcopy(self._audit_trail)}

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(),indent=indent)
