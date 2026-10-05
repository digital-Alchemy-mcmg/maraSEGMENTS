// ============================================================
// B1 — DECOUPLE: Trace target requirements into source
// ============================================================

import type { SealedAEnvelope, StageASidecar, B1Tag, B1Result, RequirementTaxonomy } from '../types';
import { checkAccess } from '../authority/access-control';
import { sha256 } from '../authority/canonical-sdna';

function findSourceOccurrence(text: string, wording: string): { found: boolean; start: number; end: number; excerpt: string } {
  const lower = text.toLowerCase();
  const wordingLower = wording.toLowerCase();

  // Try exact substring
  let idx = lower.indexOf(wordingLower);
  if (idx >= 0) {
    return { found: true, start: idx, end: idx + wording.length, excerpt: text.substring(idx, idx + wording.length) };
  }

  // Try significant tokens (3+ chars)
  const tokens = wording.split(/\s+/).filter(t => t.length >= 3).map(t => t.toLowerCase());
  if (tokens.length === 0) return { found: false, start: 0, end: 0, excerpt: '' };

  let bestStart = -1, bestEnd = -1, bestCount = 0;
  const windowSize = Math.min(500, text.length);

  for (let i = 0; i <= text.length - 50; i += 20) {
    const window = lower.substring(i, i + windowSize);
    let count = 0;
    for (const t of tokens) {
      if (window.includes(t)) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestStart = i;
      bestEnd = Math.min(i + windowSize, text.length);
    }
  }

  if (bestCount > 0 && bestCount >= tokens.length * 0.3) {
    const excerpt = text.substring(bestStart, Math.min(bestStart + 200, bestEnd));
    return { found: true, start: bestStart, end: Math.min(bestStart + 200, bestEnd), excerpt };
  }

  return { found: false, start: 0, end: 0, excerpt: '' };
}

export async function runB1(
  envelope: SealedAEnvelope,
  sidecar: StageASidecar
): Promise<B1Result> {
  // Access control
  checkAccess('B1', 'RAW_TARGET_TEXT', 'READ');
  checkAccess('B1', 'TEMPORARY_TARGET_TAGS', 'WRITE');

  const rawPosting = sidecar.raw_posting;
  const requirements: RequirementTaxonomy[] = envelope.A_scout.requirements_taxonomy;
  const tags: B1Tag[] = [];

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const occurrence = findSourceOccurrence(rawPosting, req.wording || req.label);

    tags.push({
      tag_id: `tag-b1-${String(i + 1).padStart(3, '0')}`,
      requirement_label: req.label,
      classification: req.classification,
      source_match: occurrence.found,
      span_start: occurrence.start,
      span_end: occurrence.end,
      source_excerpt: occurrence.excerpt,
    });
  }

  const targetHash = await sha256(rawPosting);
  const matched = tags.filter(t => t.source_match).length;

  return {
    tags,
    receipt: {
      stage: 'B1',
      timestamp: new Date().toISOString(),
      tag_count: tags.length,
      matched_count: matched,
      unmatched_count: tags.length - matched,
      target_source_sha256: targetHash,
    },
  };
}
