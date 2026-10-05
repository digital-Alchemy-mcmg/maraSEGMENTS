import hashlib
import json
import unittest
import uuid
import yaml
from src.harness_runner import StageBHarness
from src.sidecar.b_sidecar import BSidecar, SidecarStage
from src.envelope.master_envelope import RunIdentityMismatchError

def canonical_sdna_hash(data):
    obj=json.loads(json.dumps(data)); obj.setdefault("integrity",{}).pop("content_sha256",None)
    return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def build_inputs():
    token=uuid.uuid4().hex
    candidate_id=f"cand-{token}"; target_id=f"target-{token}"; run_id=f"run-{token}"
    raw=f"Requirement {token}: distributed systems operations and production reliability."
    source_hash=hashlib.sha256(raw.encode()).hexdigest()
    sdna={"schema_version":"2.0.0","candidate":{"candidate_id":candidate_id,"full_name":f"Candidate {token}","primary_contact":{}},"source_registry":[{"source_id":f"src-{token}","hash":hashlib.sha256(token.encode()).hexdigest()}],"domains":{"IDENTITY":{"atoms":[{"atom_id":f"id-{token}","content":f"Candidate {token}","source_pointer":f"src-{token}","evidence_provenance":"operator"}]},"WORK_HISTORY":{"atoms":[{"atom_id":f"work-{token}","content":f"Distributed systems operations production reliability {token}","source_pointer":f"src-{token}","evidence_provenance":"operator"}]},"EDUCATION_TECH":{"atoms":[]},"CREATIVE_PROJECTS":{"atoms":[]},"COGNITIVE_PROFILE":{"atoms":[]},"TESTIMONY_REFERENCES":{"atoms":[]}},"chronology":{"events":[]},"conflicts":{"unresolved":[],"resolved":[]},"relationships":[],"integrity":{"signed_epoch":0}}
    sdna["integrity"]["content_sha256"]=canonical_sdna_hash(sdna)
    env={"envelope_version":"2.0.0","Z_state":{"run_id":run_id,"candidate_id":candidate_id,"target_id":target_id,"pipeline_version":"2.0.0","current_stage":"A_SCOUT_COMPLETE","status":"STAGE_A_COMPLETED","run_policy":{}},"A_scout":{"target_entity":{"company_name":f"Company-{token}","job_title":f"Role-{token}","destination_context":"TEST"},"requirements_taxonomy":{"hard_requirements":[raw],"soft_requirements":[],"keyword_lexicon":[]},"original_content_sha256":source_hash,"source_url":""}}
    sidecar={"raw_posting":raw,"original_content_sha256":source_hash,"source_url":"","run_binding":{"run_id":run_id,"target_id":target_id}}
    return env,sidecar,yaml.safe_dump(sdna,sort_keys=False)

class TestStageBHarness(unittest.TestCase):
    def test_full_lifecycle_requires_real_ingress_and_unmounts_vault(self):
        env,sidecar,sdna_yaml=build_inputs(); h=StageBHarness(); h.load_input_data(env,sidecar,sdna_yaml); result=h.execute_stage_b()
        self.assertEqual(result["status"],"STAGE_B_COMPLETED"); self.assertTrue(result["candidate_vault_unmounted"])
        self.assertEqual(result["tombstone"]["status"],"TERMINATED_AND_VERIFIED")
        self.assertFalse(result["tombstone"]["destruction_verification"]["physical_memory_zeroization_guaranteed"])
        self.assertTrue(h.envelope.verify_c1_handoff_readiness()[0])
    def test_sidecar_hash_mismatch_fails_closed(self):
        env,sidecar,sdna_yaml=build_inputs(); sidecar["raw_posting"]+=" tampered"
        with self.assertRaises(RunIdentityMismatchError): StageBHarness().load_input_data(env,sidecar,sdna_yaml)
    def test_b3_sidecar_read_is_prohibited(self):
        sc=BSidecar("authoritative source")
        with self.assertRaises(PermissionError): sc.read_source_text(SidecarStage.B3)
        with self.assertRaises(PermissionError): sc.read_source_text(SidecarStage.B5_SEMANTIC)
    def test_b5_does_not_set_layout_density_or_page_count(self):
        env,sidecar,sdna_yaml=build_inputs(); h=StageBHarness(); h.load_input_data(env,sidecar,sdna_yaml); h.execute_stage_b()
        geo=h.envelope._B_sdna["b5_projection"]["geometric_directives"]
        self.assertNotIn("target_pages",geo); self.assertNotIn("density",geo)
    def test_integrity_hash_mismatch_rejected(self):
        env,sidecar,sdna_yaml=build_inputs(); data=yaml.safe_load(sdna_yaml); data["integrity"]["content_sha256"]="0"*64
        with self.assertRaises(ValueError): StageBHarness().load_input_data(env,sidecar,yaml.safe_dump(data,sort_keys=False))

if __name__=="__main__": unittest.main()
