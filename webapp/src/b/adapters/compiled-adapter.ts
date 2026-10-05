// ============================================================
// Compiled Input Adapter (future A→B)
// ============================================================

import type { SealedAEnvelope, StageASidecar, CandidateVaultState, BContext, StageProgression } from '../types';
import { hydrateEnvelope } from '../authority/envelope';

export function createCompiledBContext(
  existingEnvelope: SealedAEnvelope,
  existingSidecar: StageASidecar,
  mountedCandidateVault: CandidateVaultState
): BContext {
  const envelope = hydrateEnvelope(existingEnvelope);

  const stageProgression: StageProgression = {
    INGRESS: 'READY',
    B1: 'LOCKED', B2: 'LOCKED', B3: 'LOCKED',
    B4: 'LOCKED', B5: 'LOCKED', T06: 'LOCKED', EXPORT: 'LOCKED',
  };

  return {
    identity: {
      run_id: envelope.Z_state.run_id,
      candidate_id: envelope.Z_state.candidate_id,
      target_id: envelope.Z_state.target_id,
      pipeline_version: envelope.Z_state.pipeline_version,
      sdna_manifest_sha256: envelope.Z_state.sdna_manifest_sha256 || mountedCandidateVault.canonical_manifest_sha256,
      target_source_sha256: mountedCandidateVault.raw_yaml_sha256,
    },
    envelope,
    sidecar: existingSidecar,
    vault: mountedCandidateVault,
    stageProgression,
    errors: [],
  };
}
