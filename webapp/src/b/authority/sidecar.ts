// ============================================================
// Sidecar Binding & Termination
// ============================================================

import type { StageASidecar, SidecarAttestation } from '../types';

export function hydrateSidecar(raw: any): StageASidecar {
  if (!raw || typeof raw !== 'object') throw new Error('Sidecar must be an object');
  if (!raw.run_binding) throw new Error('Sidecar missing run_binding');
  if (!raw.run_binding.run_id) throw new Error('Sidecar missing run_binding.run_id');
  if (!raw.run_binding.target_id) throw new Error('Sidecar missing run_binding.target_id');
  if (typeof raw.raw_posting !== 'string') throw new Error('Sidecar missing raw_posting');
  if (!raw.original_content_sha256) throw new Error('Sidecar missing original_content_sha256');
  return raw as StageASidecar;
}

export function createSidecarAttestation(): SidecarAttestation {
  return {
    status: 'TERMINATED_AND_VERIFIED',
    destruction_verification: {
      method: 'APPLICATION_REFERENCE_PURGE',
      owned_references_unreachable: true,
      physical_memory_zeroization_guaranteed: false,
      scope: 'application/runtime object graph only',
    },
  };
}
