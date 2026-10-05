# Segment B Ingress / Egress

Standalone ingress:
- SEALED_A_ENVELOPE.json
- STAGE_A_SIDECAR.json
- candidate.sdna.yaml

Canonical envelope identity: Z_state.run_id, Z_state.candidate_id, Z_state.target_id, Z_state.pipeline_version.
Canonical Scout state: A_scout.target_entity, A_scout.requirements_taxonomy, A_scout.original_content_sha256.

Continuity gates fail closed on missing or mismatched run, target, candidate, or source-hash identity.

C egress is SEALED_B_ENVELOPE.json only. Raw SDNA, CandidateVault, raw sidecar/source, raw HTML, and temporary tags do not travel to C. GATE_B_RECEIPT.json and B_AUDIT_REPORT.json are operator receipts, not alternate C authorities.
