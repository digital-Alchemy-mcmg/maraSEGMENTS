// ============================================================
// Ingress Gate — all mandatory continuity checks
// ============================================================

import type { SealedAEnvelope, StageASidecar, CandidateVaultState, PipelineIdentity } from '../types';
import { sha256 } from './canonical-sdna';

export interface IngressResult {
  passed: boolean;
  identity: PipelineIdentity | null;
  checks: IngressCheck[];
}

export interface IngressCheck {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  message: string;
}

export async function runIngressGate(
  envelope: SealedAEnvelope,
  sidecar: StageASidecar,
  vault: CandidateVaultState
): Promise<IngressResult> {
  const checks: IngressCheck[] = [];
  const z = envelope.Z_state;

  // Helper
  const require_eq = (name: string, expected: any, actual: any, desc: string) => {
    const e = String(expected ?? '');
    const a = String(actual ?? '');
    const passed = e !== '' && a !== '' && e === a;
    checks.push({ name, passed, expected: e, actual: a, message: passed ? desc + ' OK' : `${desc}: expected ${e}, got ${a}` });
  };

  const require_exists = (name: string, val: any, desc: string) => {
    const passed = val !== undefined && val !== null && val !== '';
    checks.push({ name, passed, expected: 'present', actual: val === undefined ? 'undefined' : val === null ? 'null' : String(val), message: passed ? desc + ' OK' : `${desc}: missing` });
  };

  // 1. run_id
  require_exists('Z_state.run_id', z?.run_id, 'Envelope Z_state.run_id');
  require_exists('sidecar.run_binding.run_id', sidecar.run_binding?.run_id, 'Sidecar run_binding.run_id');
  require_eq('run_id_match', z?.run_id, sidecar.run_binding?.run_id, 'run_id envelope.Z_state↔sidecar');

  // 2. target_id
  require_exists('Z_state.target_id', z?.target_id, 'Envelope Z_state.target_id');
  require_exists('sidecar.run_binding.target_id', sidecar.run_binding?.target_id, 'Sidecar run_binding.target_id');
  require_eq('target_id_match', z?.target_id, sidecar.run_binding?.target_id, 'target_id envelope.Z_state↔sidecar');

  // 3. candidate_id
  require_exists('Z_state.candidate_id', z?.candidate_id, 'Envelope Z_state.candidate_id');
  require_exists('vault.candidate_id', vault.candidate_id, 'Vault candidate_id');
  require_eq('candidate_id_match', z?.candidate_id, vault.candidate_id, 'candidate_id envelope.Z_state↔vault');

  // 4. sdna_manifest_sha256 (optional in Z_state — checked only when present)
  if (z?.sdna_manifest_sha256) {
    require_exists('vault.canonical_manifest_sha256', vault.canonical_manifest_sha256, 'Vault canonical_manifest_sha256');
    require_eq('sdna_hash_match', z.sdna_manifest_sha256, vault.canonical_manifest_sha256, 'sdna_manifest_sha256 envelope.Z_state↔vault');
  }

  // 5. target source hash — three-way
  const computedHash = await sha256(sidecar.raw_posting);
  require_exists('sidecar.original_content_sha256', sidecar.original_content_sha256, 'Sidecar original_content_sha256');
  require_eq('sidecar_hash_computed', sidecar.original_content_sha256, computedHash, 'SHA256(raw_posting) = sidecar.original_content_sha256');
  require_eq('sidecar_hash_a_scout', sidecar.original_content_sha256, envelope.A_scout?.original_content_sha256, 'sidecar hash = A_scout.original_content_sha256');

  // 6. pipeline_version
  require_exists('Z_state.pipeline_version', z?.pipeline_version, 'Pipeline version');

  // 7. run bindings exist
  require_exists('sidecar.run_binding', sidecar.run_binding, 'Sidecar run_binding');

  // 8. A_scout structural checks
  require_exists('A_scout.target_entity', envelope.A_scout?.target_entity, 'A_scout target_entity');
  require_exists('A_scout.requirements_taxonomy', envelope.A_scout?.requirements_taxonomy, 'A_scout requirements_taxonomy');

  const passed = checks.every(c => c.passed);

  const identity: PipelineIdentity | null = passed ? {
    run_id: z.run_id,
    candidate_id: z.candidate_id,
    target_id: z.target_id,
    pipeline_version: z.pipeline_version,
    sdna_manifest_sha256: z.sdna_manifest_sha256 || vault.canonical_manifest_sha256,
    target_source_sha256: computedHash,
  } : null;

  return { passed, identity, checks };
}
