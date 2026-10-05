# Segment B Architecture

Segment B is an APP-IN-FLOW deterministic transformation between sealed Segment A state and Segment C.

Standalone ingress: SEALED_A_ENVELOPE + STAGE_A_SIDECAR + candidate SDNA YAML -> standalone adapter -> common admission gate.
Compiled ingress: existing sealed A envelope + stationary sidecar + mounted verified candidate context -> compiled adapter -> the same common admission gate.

Execution order: B1 Decouple -> B2 Target Tree -> B3 Evidence Binding -> B4 Truth Audit -> B5 Five-Prism Projection -> T06 -> sidecar termination -> vault unmount -> C1 readiness.

There is one B engine. Full-cycle execution uses the same stage functions as individual-stage execution. No AI/LLM participates in runtime semantics.

Authority boundaries:
- B1/B2 are target-side.
- B3 sees B2 plus CandidateVault, not sidecar raw source.
- B4 audits B3 against CandidateVault and target trace.
- B5 sees audited semantic state, not raw sidecar or raw SDNA.
- C receives sealed B envelope state only.
