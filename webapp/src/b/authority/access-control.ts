// ============================================================
// Access Control Matrix — runtime enforcement
// ============================================================

import type { AccessLevel, StageName } from '../types';

export class AccessViolationError extends Error {
  constructor(stage: string, resource: string) {
    super(`ACCESS VIOLATION: Stage ${stage} cannot access ${resource}`);
    this.name = 'AccessViolationError';
  }
}

type Resource = 'RAW_TARGET_TEXT' | 'RAW_HTML' | 'TEMPORARY_TARGET_TAGS' |
  'CANDIDATE_SDNA_ATOMS' | 'B4_LEDGER' | 'B5_PROJECTION';

const MATRIX: Record<Resource, Record<string, AccessLevel>> = {
  RAW_TARGET_TEXT: {
    B1: 'READ', B2: 'NO', B3: 'FORBIDDEN', B4: 'READ',
    B5: 'FORBIDDEN', T06: 'READ', C: 'FORBIDDEN',
  },
  RAW_HTML: {
    B1: 'READ', B2: 'NO', B3: 'NO', B4: 'NO',
    B5: 'NO', T06: 'NO', C: 'NO',
  },
  TEMPORARY_TARGET_TAGS: {
    B1: 'WRITE', B2: 'READ', B3: 'NO', B4: 'PURGE',
    B5: 'NO', T06: 'HASH_ONLY', C: 'NO',
  },
  CANDIDATE_SDNA_ATOMS: {
    B1: 'NO', B2: 'NO', B3: 'READ', B4: 'READ',
    B5: 'NO', T06: 'NO', C: 'NO',
  },
  B4_LEDGER: {
    B5: 'READ', T06: 'READ', C: 'PASS_THROUGH',
  },
  B5_PROJECTION: {
    T06: 'VERIFY', C: 'PASS_THROUGH',
  },
};

export function checkAccess(stage: string, resource: Resource, operation: 'READ' | 'WRITE' | 'PURGE'): void {
  const allowed = MATRIX[resource]?.[stage];
  if (!allowed || allowed === 'NO' || allowed === 'FORBIDDEN') {
    throw new AccessViolationError(stage, resource);
  }
  if (operation === 'WRITE' && allowed !== 'WRITE') {
    throw new AccessViolationError(stage, `${resource} (write)`);
  }
  if (operation === 'PURGE' && allowed !== 'PURGE') {
    throw new AccessViolationError(stage, `${resource} (purge)`);
  }
}

export function getAccessMatrix() { return MATRIX; }
