// ============================================================
// T06 — INDEPENDENT TRACE VERIFIER
// ============================================================

import type { B2Result, B4Result, B5Result, B1Result, StageASidecar, TraceReceipt, TraceWalk } from '../types';
import { sha256 } from '../authority/canonical-sdna';

export async function runT06(
  b1Result: B1Result,
  b2Result: B2Result,
  b4Result: B4Result,
  b5Result: B5Result,
  sidecar: StageASidecar,
  aScoutSourceHash: string
): Promise<TraceReceipt> {
  const errors: string[] = [];
  const walks: TraceWalk[] = [];

  // Verify target hash three-way
  const recomputedHash = await sha256(sidecar.raw_posting);
  const threeWayMatch =
    recomputedHash === sidecar.original_content_sha256 &&
    recomputedHash === aScoutSourceHash;

  if (!threeWayMatch) {
    errors.push(`Three-way hash mismatch: computed=${recomputedHash}, sidecar=${sidecar.original_content_sha256}, A_scout=${aScoutSourceHash}`);
  }

  // Verify each B5 proposition traces back
  for (const prop of b5Result.verified_candidate_propositions) {
    const b4Record = b4Result.ledger.find(r => r.node_id === prop.originating_b4_node);
    if (!b4Record) {
      errors.push(`B5 prop ${prop.proposition_id}: no B4 record for ${prop.originating_b4_node}`);
      continue;
    }
    if (b4Record.disposition !== prop.disposition) {
      errors.push(`B5 prop ${prop.proposition_id}: disposition mismatch B4=${b4Record.disposition} B5=${prop.disposition}`);
    }

    const b2Node = b2Result.nodes[prop.originating_b4_node];
    if (!b2Node) {
      errors.push(`B5 prop ${prop.proposition_id}: no B2 node for ${prop.originating_b4_node}`);
      continue;
    }

    // Verify source trace anchor
    let sidecarSourceValid = false;
    if (b2Node.source_trace.source_match && b2Node.source_trace.source_excerpt) {
      const excerpt = sidecar.raw_posting.substring(b2Node.source_trace.span_start, b2Node.source_trace.span_end);
      sidecarSourceValid = excerpt === b2Node.source_trace.source_excerpt;
      if (!sidecarSourceValid) {
        // Check partial match (B1 may have truncated)
        sidecarSourceValid = excerpt.startsWith(b2Node.source_trace.source_excerpt.substring(0, 50)) ||
          b2Node.source_trace.source_excerpt.startsWith(excerpt.substring(0, 50));
        if (!sidecarSourceValid) {
          errors.push(`B5 prop ${prop.proposition_id}: source excerpt mismatch at span [${b2Node.source_trace.span_start}:${b2Node.source_trace.span_end}]`);
        }
      }
    } else {
      sidecarSourceValid = true; // No match was claimed
    }

    walks.push({
      B5_DECISION: prop.proposition_id,
      B4_LEDGER: prop.originating_b4_node,
      B3_ATOM: prop.atom_id,
      B2_TARGET_TRACE: b2Node.source_trace.tag_id,
      SIDECAR_SOURCE: sidecarSourceValid,
      THREE_WAY_HASH: threeWayMatch,
    });
  }

  const result = errors.length === 0 ? 'PASS' : 'FAIL';

  return {
    verifier_id: `t06-${Date.now()}`,
    result,
    verified_walk: walks,
    three_way_match: threeWayMatch,
    recomputed_sidecar_hash: recomputedHash,
    anchors_checked: walks.length,
    errors,
  };
}
