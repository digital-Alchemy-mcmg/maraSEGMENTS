import os
import json
from typing import Dict, Any
from .envelope.master_envelope import MasterTravelingEnvelope
from .c_stages.c1_docket import C1DocketSynthesizer
from .c_stages.c2_claims import C2ClaimsFormulator
from .c_stages.c3_model import C3DocumentModeler
from .c_stages.c4_layout import C4LayoutFitter
from .c_stages.c5_artifact import C5HtmlSerializer

class StageCHarness:
    """Self-contained runner for Stage C Resume Factory (C1 through C5)."""

    def __init__(self):
        self.envelope: MasterTravelingEnvelope = None

    def load_envelope(self, envelope_path: str) -> None:
        with open(envelope_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.load_envelope_data(data)

    def load_envelope_data(self, data: Dict[str, Any]) -> None:
        if not isinstance(data, dict):
            raise TypeError("Stage C ingress must be a Stage B handoff envelope object.")

        def reject_raw_authority_leakage(value: Any, path: str = "root") -> None:
            prohibited = {"raw_posting", "raw_job_description_text", "raw_html", "full_text", "source_text", "candidate_sdna", "sdna_yaml", "sdna_manifest", "candidate_atoms", "candidate_vault", "sidecar", "raw_sidecar"}
            if isinstance(value, dict):
                for k, v in value.items():
                    if k in prohibited:
                        raise ValueError(f"Prohibited leakage found at {path}.{k}")
                    reject_raw_authority_leakage(v, path + "." + str(k))
            elif isinstance(value, list):
                for i, v in enumerate(value):
                    reject_raw_authority_leakage(v, path + f"[{i}]")

        reject_raw_authority_leakage(data)

        z = data.get("Z_state")
        scout = data.get("A_scout")
        b_data = data.get("B_sdna")
        if not isinstance(z, dict) or not isinstance(scout, dict) or not isinstance(b_data, dict):
            raise ValueError("Stage C ingress requires Z_state, A_scout, and B_sdna.")
        self.envelope = MasterTravelingEnvelope(
            candidate_id=z["candidate_id"],
            target_id=z["target_id"],
            run_policy=z.get("run_policy"),
            pipeline_version=z.get("pipeline_version", "2.0.0-fork"),
        )
        self.envelope.run_id = z["run_id"]
        self.envelope.append_scout(
            target_entity=scout["target_entity"],
            requirements_taxonomy=scout["requirements_taxonomy"],
            original_content_sha256=scout["original_content_sha256"],
            source_url=scout.get("source_url", ""),
        )
        self.envelope.append_b_layer(
            competency_tree=b_data["competency_tree"],
            b4_ledger=b_data["b4_ledger"],
            b5_projection=b_data["b5_projection"],
            b_sidecar_attestation=b_data["B_sidecar_attestation"],
        )

    def execute_stage_c(self) -> Dict[str, Any]:
        if self.envelope is None:
            raise RuntimeError("Stage C cannot execute before an actual Stage B handoff is loaded.")
        ready, errors = self.envelope.verify_c1_handoff_readiness()
        if not ready:
            raise PermissionError(f"C1 Ingestion Rejected: {errors}")
        b_sdna = self.envelope._B_sdna
        a_scout = self.envelope._A_scout
        candidate_identity = b_sdna["b4_ledger"].get("candidate_identity")
        if not isinstance(candidate_identity, dict):
            raise ValueError("Stage C requires b4_ledger.candidate_identity.")
        c1_docket = C1DocketSynthesizer.execute(b_sdna, a_scout)
        self.envelope.append_c_stage("C1_docket", c1_docket)
        c2_claims = C2ClaimsFormulator.execute(c1_docket, a_scout, candidate_identity)
        self.envelope.append_c_stage("C2_claims", c2_claims)
        c3_model = C3DocumentModeler.execute(c2_claims, candidate_identity)
        self.envelope.append_c_stage("C3_model", c3_model)
        c4_layout = C4LayoutFitter.execute(c3_model, self.envelope.run_policy)
        self.envelope.append_c_stage("C4_layout", c4_layout)
        c5_artifact = C5HtmlSerializer.execute(c3_model, c4_layout)
        self.envelope.append_c_stage("C5_artifact", c5_artifact)
        self.envelope.status = "complete:RUN_COMPLETED"
        self.envelope.current_stage = "C5_COMPLETE"
        return {
            "status": "STAGE_C_COMPLETED",
            "docket_items": c1_docket["total_admitted_atoms"],
            "allocated_lines": c4_layout["line_budget"]["allocated_lines"],
            "density_ratio": c4_layout["line_budget"]["density_ratio"],
            "artifact_sha256": c5_artifact["artifact_sha256"],
        }

    def export_artifacts(self, output_dir: str = "./output_stage_c") -> Dict[str, str]:
        if self.envelope is None or self.envelope._C_factory.get("C5_artifact") is None:
            raise RuntimeError("No completed C5 artifact is available to export.")
        os.makedirs(output_dir, exist_ok=True)
        env_path = os.path.join(output_dir, "final_envelope_completed.json")
        html_path = os.path.join(output_dir, "final_resume.html")
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(self.envelope.to_json(indent=2))
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(self.envelope._C_factory["C5_artifact"]["content_html"])
        return {"envelope_path": env_path, "html_path": html_path}
