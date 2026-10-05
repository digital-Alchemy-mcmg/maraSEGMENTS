import unittest
from src.c_stages.c3_model import C3DocumentModeler
from src.c_stages.c5_artifact import C5HtmlSerializer

class TestNoImplicitContent(unittest.TestCase):
    def test_c1_handoff_fails_if_b4_ledger_missing(self):
        from src.envelope.master_envelope import MasterTravelingEnvelope
        env = MasterTravelingEnvelope("cand", "targ")
        env._A_scout = {"target_entity": {}, "requirements_taxonomy": {}, "original_content_sha256": ""}
        env._B_sdna = {"B_sidecar_attestation": {"status": "TERMINATED_AND_VERIFIED"}}
        ready, errors = env.verify_c1_handoff_readiness()
        self.assertFalse(ready)
        self.assertTrue(any("Missing" in err for err in errors))

    def test_c1_handoff_fails_if_raw_sdna_present(self):
        from src.harness_runner import StageCHarness
        h = StageCHarness()
        with self.assertRaises(ValueError):
            h.load_envelope_data({"raw_posting": "text", "Z_state": {"candidate_id": "", "target_id": "", "run_id": ""}, "A_scout": {}, "B_sdna": {}})
        with self.assertRaises(ValueError):
            h.load_envelope_data({"sdna_yaml": "...", "Z_state": {"candidate_id": "", "target_id": "", "run_id": ""}, "A_scout": {}, "B_sdna": {}})

    def test_c1_handoff_allows_candidate_identity(self):
        from src.harness_runner import StageCHarness
        h = StageCHarness()
        # Should not raise ValueError for candidate_identity
        try:
            h.load_envelope_data({"candidate_identity": {"candidate_id": "test"}, "Z_state": {"candidate_id": "", "target_id": "", "run_id": ""}, "A_scout": {"target_entity": {}, "requirements_taxonomy": {}, "original_content_sha256": ""}, "B_sdna": {"competency_tree": {}, "b4_ledger": {}, "b5_projection": {}, "B_sidecar_attestation": {}}})
        except ValueError as e:
            if "Prohibited leakage" in str(e):
                self.fail(f"Raised ValueError unexpectedly: {e}")
        except Exception:
            pass # Other errors like KeyError from downstream logic are fine here

    def test_c1_handoff_allows_empty_unresolved_gaps(self):
        from src.envelope.master_envelope import MasterTravelingEnvelope
        env = MasterTravelingEnvelope("cand", "targ")
        env.status = "complete:STOP_BEFORE_RESUME_FACTORY"
        env._A_scout = {"target_entity": {}, "requirements_taxonomy": {}, "original_content_sha256": ""}
        env._B_sdna = {
            "B_sidecar_attestation": {"status": "TERMINATED_AND_VERIFIED"},
            "b4_ledger": {"candidate_identity": {}, "admitted_bindings": [], "ledger_sha256": "x"},
            "b5_projection": {
                "verified_candidate_propositions": [],
                "semantic_priorities": {},
                "writing_boundaries": {},
                "ordering_guidance": [],
                "unresolved_gaps": [], # empty list is valid
                "projection_posture": "EVIDENCE_BOUNDED",
                "owner_prism": "Prism",
            }
        }
        ready, errors = env.verify_c1_handoff_readiness()
        self.assertTrue(ready, f"Should be ready, but got errors: {errors}")

    def test_c3_requires_identity(self):
        with self.assertRaises(ValueError):
            C3DocumentModeler.execute({}, {})
    def test_c5_requires_geometry(self):
        with self.assertRaises(ValueError):
            C5HtmlSerializer.execute({"ast_root":{"header":{},"sections":[]}}, {})

if __name__=="__main__": unittest.main()
