import os
import json
from typing import Dict, Any, Optional
from .sidecar.b_sidecar import BSidecar
from .sidecar.trace_verifier import B5IndependentTraceVerifier
from .sidecar.shredder import SidecarShredder
from .envelope.master_envelope import MasterTravelingEnvelope, MissingEnvelopeInputError, RunIdentityMismatchError
from .sdna.candidate_vault import CandidateVault
from .sdna.validator import SDNAValidator
from .b_stages.b1_decouple import B1DecoupleProcessor
from .b_stages.b2_tree import B2TreeSynthesizer
from .b_stages.b3_binding import B3EvidenceBinder
from .b_stages.b4_audit import B4TruthAuditLedger
from .b_stages.b5_prisms import B5FivePrismEngine


class StageBHarness:
    """Standalone Stage B runner. No default candidate or target data exists."""

    def __init__(self):
        self.envelope: Optional[MasterTravelingEnvelope] = None
        self.sidecar: Optional[BSidecar] = None
        self.vault: Optional[CandidateVault] = None

    def load_inputs(self, envelope_path: str, sidecar_path: str, candidate_yaml_path: str) -> None:
        for path, label in ((envelope_path, "Envelope"), (sidecar_path, "Sidecar"), (candidate_yaml_path, "Candidate SDNA")):
            if not path or not os.path.exists(path):
                raise MissingEnvelopeInputError(path or label, "STAGE_B_LOAD", f"{label} file not found.")
        with open(envelope_path, "r", encoding="utf-8") as f:
            env_data = json.load(f)
        with open(sidecar_path, "r", encoding="utf-8") as f:
            sidecar_data = json.load(f)
        with open(candidate_yaml_path, "r", encoding="utf-8") as f:
            yaml_text = f.read()
        self.load_input_data(env_data, sidecar_data, yaml_text)

    def load_input_data(self, env_data: Dict[str, Any], sidecar_data: Dict[str, Any], candidate_yaml: str) -> None:
        if not isinstance(env_data, dict) or not isinstance(sidecar_data, dict) or not candidate_yaml.strip():
            raise MissingEnvelopeInputError("authoritative Stage B inputs", "STAGE_B_LOAD")
        z = env_data.get("Z_state")
        scout = env_data.get("A_scout")
        if not isinstance(z, dict) or not isinstance(scout, dict):
            raise MissingEnvelopeInputError("Z_state/A_scout", "STAGE_B_LOAD")
        for key in ("run_id", "candidate_id", "target_id"):
            if not z.get(key):
                raise MissingEnvelopeInputError(f"Z_state.{key}", "STAGE_B_LOAD")
        for key in ("target_entity", "requirements_taxonomy", "original_content_sha256"):
            if key not in scout:
                raise MissingEnvelopeInputError(f"A_scout.{key}", "STAGE_B_LOAD")
        if not sidecar_data.get("raw_posting"):
            raise MissingEnvelopeInputError("sidecar.raw_posting", "STAGE_B_LOAD")

        valid, parsed, report = SDNAValidator.validate(candidate_yaml)
        if not valid or parsed is None:
            raise ValueError(f"Candidate SDNA failed validation: {report.errors}")
        self.vault = CandidateVault(candidate_yaml, parsed, report.content_sha256)

        self.envelope = MasterTravelingEnvelope(
            candidate_id=z["candidate_id"], target_id=z["target_id"],
            run_policy=z.get("run_policy"), pipeline_version=z.get("pipeline_version", "2.0.0-fork")
        )
        self.envelope.run_id = z["run_id"]
        if self.vault.candidate_id != self.envelope.candidate_id:
            raise RunIdentityMismatchError(
                f"Candidate mismatch: mounted SDNA is {self.vault.candidate_id!r}, envelope is {self.envelope.candidate_id!r}."
            )
        self.envelope.append_scout(
            target_entity=scout["target_entity"], requirements_taxonomy=scout["requirements_taxonomy"],
            original_content_sha256=scout["original_content_sha256"], source_url=scout.get("source_url", "")
        )
        self.sidecar = BSidecar(
            raw_posting=sidecar_data["raw_posting"], raw_html=sidecar_data.get("raw_html", ""),
            source_url=sidecar_data.get("source_url", ""), metadata=sidecar_data.get("run_binding", {})
        )
        if self.sidecar.original_content_sha256 != scout["original_content_sha256"]:
            raise RunIdentityMismatchError("Sidecar content hash does not match A_scout.original_content_sha256.")
        binding = sidecar_data.get("run_binding") or {}
        if binding.get("run_id") and binding["run_id"] != z["run_id"]:
            raise RunIdentityMismatchError("Sidecar run_id does not match envelope run_id.")
        if binding.get("target_id") and binding["target_id"] != z["target_id"]:
            raise RunIdentityMismatchError("Sidecar target_id does not match envelope target_id.")

    def execute_stage_b(self) -> Dict[str, Any]:
        if not self.envelope or not self.sidecar or not self.vault:
            raise MissingEnvelopeInputError("loaded Stage B inputs", "B1")
        self.envelope.validate_boundary("B1")
        taxonomy = self.envelope._A_scout["requirements_taxonomy"]
        target_title = self.envelope._A_scout["target_entity"]["job_title"]

        b1 = B1DecoupleProcessor.execute(self.sidecar, taxonomy)
        b2 = B2TreeSynthesizer.execute(taxonomy, self.sidecar)
        b3 = B3EvidenceBinder.execute(b2, self.vault)
        identity = self.vault.get_candidate_identity("B4")
        b4 = B4TruthAuditLedger.execute(b3, b2, self.sidecar, self.vault, identity)
        b5 = B5FivePrismEngine.execute(b4, b2, target_title)

        anchors = [p["originating_b4_node"] for p in b5["verified_candidate_propositions"]]
        verifier = B5IndependentTraceVerifier()
        trace = verifier.verify_trace(
            self.sidecar, self.envelope._A_scout["original_content_sha256"], anchors,
            {item["node_id"]: item for item in b4["admitted_bindings"]}, b2["nodes"]
        )
        if not trace.passed:
            raise RuntimeError(f"T06 Trace Verification Failed: {trace.error_detail}")
        tombstone = SidecarShredder.shred_and_attest(
            self.sidecar, trace, b2["frozen_tree_sha256"], b4["ledger_sha256"], b4["tag_layer_sha256"]
        )
        self.envelope.append_b_layer(b2, b4, b5, tombstone)
        self.vault.unmount()
        return {
            "status": "STAGE_B_COMPLETED",
            "b1_tag_count": b1["tag_count"],
            "b4_match_pct": b4["intake_match_percentage"],
            "owner_prism": b5["owner_prism"],
            "tombstone": tombstone,
            "candidate_vault_unmounted": not self.vault.is_mounted,
        }

    def export_stage_c_handoff(self, output_path: str) -> str:
        if not output_path:
            raise ValueError("An explicit Stage C handoff output path is required.")
        if not self.envelope:
            raise RuntimeError("No Stage B envelope is loaded.")
        ready, errors = self.envelope.verify_c1_handoff_readiness()
        if not ready:
            raise RuntimeError(f"C1 handoff barrier failed: {errors}")
        directory = os.path.dirname(output_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(self.envelope.to_json(indent=2))
        return output_path
