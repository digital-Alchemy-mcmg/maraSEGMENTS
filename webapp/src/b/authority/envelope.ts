// ============================================================
// Envelope Hydration — exact existing state, no reconstruction
// ============================================================

import type { SealedAEnvelope, BLayer, SealedBEnvelope, RequirementTaxonomy, RawRequirementsTaxonomy } from '../types';

/**
 * Normalize canonical A_scout.requirements_taxonomy into the
 * RequirementTaxonomy[] that B1/B2 consume.
 *
 * Canonical shape (from Segment A):
 *   { hard_requirements: string[], soft_requirements: string[], keyword_lexicon: string[] }
 *
 * Legacy/test shape (array of objects):
 *   [{ requirement_id, label, classification, wording }, ...]
 *
 * Both are accepted. The canonical shape is the production contract.
 */
function normalizeTaxonomy(raw: any): { normalized: RequirementTaxonomy[]; rawTaxonomy: RawRequirementsTaxonomy | null } {
  // Canonical object shape: { hard_requirements, soft_requirements, keyword_lexicon }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (!Array.isArray(raw.hard_requirements)) {
      throw new Error('A_scout.requirements_taxonomy.hard_requirements must be an array');
    }
    if (!Array.isArray(raw.soft_requirements)) {
      throw new Error('A_scout.requirements_taxonomy.soft_requirements must be an array');
    }
    if (!Array.isArray(raw.keyword_lexicon)) {
      throw new Error('A_scout.requirements_taxonomy.keyword_lexicon must be an array');
    }
    if (raw.hard_requirements.length === 0) {
      throw new Error('A_scout.requirements_taxonomy.hard_requirements must contain at least one requirement');
    }

    const normalized: RequirementTaxonomy[] = [];
    let idx = 0;

    for (const req of raw.hard_requirements) {
      idx++;
      normalized.push({
        requirement_id: `req-hard-${String(idx).padStart(3, '0')}`,
        label: String(req),
        classification: 'HARD_REQUIREMENT',
        wording: String(req),
      });
    }

    let softIdx = 0;
    for (const req of raw.soft_requirements) {
      softIdx++;
      normalized.push({
        requirement_id: `req-soft-${String(softIdx).padStart(3, '0')}`,
        label: String(req),
        classification: 'SOFT_REQUIREMENT',
        wording: String(req),
      });
    }

    return { normalized, rawTaxonomy: raw as RawRequirementsTaxonomy };
  }

  // Legacy array shape — pass through
  if (Array.isArray(raw) && raw.length > 0) {
    return { normalized: raw as RequirementTaxonomy[], rawTaxonomy: null };
  }

  throw new Error('Envelope A_scout missing requirements_taxonomy');
}

export function hydrateEnvelope(raw: any): SealedAEnvelope {
  if (!raw || typeof raw !== 'object') throw new Error('Envelope must be an object');

  // Identity lives under Z_state
  if (!raw.Z_state || typeof raw.Z_state !== 'object') throw new Error('Envelope missing: Z_state');
  const zRequired = ['run_id', 'candidate_id', 'target_id', 'pipeline_version',
    'current_stage', 'status'] as const;
  for (const key of zRequired) {
    if (raw.Z_state[key] === undefined || raw.Z_state[key] === null) {
      throw new Error(`Envelope missing: Z_state.${key}`);
    }
  }

  // A_scout must exist
  if (!raw.A_scout || typeof raw.A_scout !== 'object') throw new Error('Envelope missing: A_scout');
  if (!raw.A_scout.requirements_taxonomy) {
    throw new Error('Envelope A_scout missing requirements_taxonomy');
  }
  if (!raw.A_scout.original_content_sha256) {
    throw new Error('Envelope A_scout missing original_content_sha256');
  }

  // Normalize taxonomy: canonical object → internal RequirementTaxonomy[]
  const { normalized, rawTaxonomy } = normalizeTaxonomy(raw.A_scout.requirements_taxonomy);

  // Build the hydrated envelope, preserving all original fields
  const envelope: SealedAEnvelope = {
    ...raw,
    A_scout: {
      ...raw.A_scout,
      requirements_taxonomy: normalized,
      _raw_taxonomy: rawTaxonomy,
    },
  };

  Object.freeze(envelope.Z_state);
  Object.freeze(envelope.A_scout);
  if (envelope.history) Object.freeze(envelope.history);
  if (envelope.audit_trail) Object.freeze(envelope.audit_trail);
  return envelope;
}

export function appendBLayer(envelope: SealedAEnvelope, bLayer: BLayer): SealedBEnvelope {
  return {
    ...envelope,
    Z_state: {
      ...envelope.Z_state,
      current_stage: 'B5_COMPLETE',
      status: 'complete:STOP_BEFORE_RESUME_FACTORY',
    },
    B_sdna: bLayer,
  };
}
