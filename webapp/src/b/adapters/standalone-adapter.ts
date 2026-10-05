// ============================================================
// Standalone Input Adapter
// ============================================================

import type { SealedAEnvelope, StageASidecar, CandidateVaultState, BContext, StageProgression } from '../types';
import { hydrateEnvelope } from '../authority/envelope';
import { hydrateSidecar } from '../authority/sidecar';
import { mountCandidateVault } from '../authority/canonical-sdna';

export async function createStandaloneBContext(
  envelopeJson: string,
  sidecarJson: string,
  candidateYaml: string
): Promise<BContext> {
  const rawEnvelope = JSON.parse(envelopeJson);
  const rawSidecar = JSON.parse(sidecarJson);

  const envelope: SealedAEnvelope = hydrateEnvelope(rawEnvelope);
  const sidecar: StageASidecar = hydrateSidecar(rawSidecar);
  const vault: CandidateVaultState = await mountCandidateVault(candidateYaml);

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
      sdna_manifest_sha256: envelope.Z_state.sdna_manifest_sha256 || vault.canonical_manifest_sha256,
      target_source_sha256: vault.raw_yaml_sha256,
    },
    envelope,
    sidecar,
    vault,
    stageProgression,
    errors: [],
  };
}
