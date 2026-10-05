// ============================================================
// C1 Readiness Barrier
// ============================================================

import type { SealedBEnvelope } from '../types';

export interface C1Check {
  field: string;
  present: boolean;
  valid: boolean;
  message: string;
}

export function checkC1Readiness(envelope: SealedBEnvelope): { ready: boolean; checks: C1Check[] } {
  const checks: C1Check[] = [];

  const check = (field: string, value: any, expectedType?: string) => {
    const present = value !== undefined && value !== null;
    let valid = present;
    if (present && expectedType === 'array') valid = Array.isArray(value);
    else if (present && expectedType === 'string') valid = typeof value === 'string' && value.length > 0;
    else if (present && expectedType === 'object') valid = typeof value === 'object' && !Array.isArray(value);
    checks.push({ field, present, valid, message: valid ? 'OK' : present ? `Wrong type for ${field}` : `Missing ${field}` });
  };

  const b = envelope.B_sdna;

  check('B_sidecar_attestation.status', b?.B_sidecar_attestation?.status, 'string');
  if (b?.B_sidecar_attestation?.status !== 'TERMINATED_AND_VERIFIED') {
    checks[checks.length - 1].valid = false;
    checks[checks.length - 1].message = 'Sidecar not TERMINATED_AND_VERIFIED';
  }

  check('b4_ledger.candidate_identity', b?.b4_ledger?.candidate_identity, 'object');
  check('b4_ledger.admitted_bindings', b?.b4_ledger?.admitted_bindings);
  check('b4_ledger.ledger_sha256', b?.b4_ledger?.ledger_sha256, 'string');
  check('b5_projection.verified_candidate_propositions', b?.b5_projection?.verified_candidate_propositions, 'array');
  check('b5_projection.semantic_priorities', b?.b5_projection?.semantic_priorities, 'array');
  check('b5_projection.writing_boundaries', b?.b5_projection?.writing_boundaries, 'object');
  check('b5_projection.ordering_guidance', b?.b5_projection?.ordering_guidance, 'array');
  // unresolved_gaps: [] is VALID — check presence/type, not truthiness
  check('b5_projection.unresolved_gaps', b?.b5_projection?.unresolved_gaps, 'array');
  check('b5_projection.projection_posture', b?.b5_projection?.projection_posture, 'string');
  check('b5_projection.owner_prism', b?.b5_projection?.owner_prism, 'string');

  return { ready: checks.every(c => c.valid), checks };
}
