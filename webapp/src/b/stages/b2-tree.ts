// ============================================================
// B2 — TARGET COMPETENCY TREE: frozen addressable target arch
// ============================================================

import type { SealedAEnvelope, B1Result, B2Result, CompetencyNode, NodeClassification, NodeWeight } from '../types';
import { checkAccess } from '../authority/access-control';
import { sha256 } from '../authority/canonical-sdna';

function deterministicStringify(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) return '[' + obj.map(v => deterministicStringify(v)).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + deterministicStringify(obj[k])).join(',') + '}';
}

export async function runB2(
  envelope: SealedAEnvelope,
  b1Result: B1Result
): Promise<B2Result> {
  checkAccess('B2', 'TEMPORARY_TARGET_TAGS', 'READ');

  const requirements = envelope.A_scout.requirements_taxonomy;
  const nodes: Record<string, CompetencyNode> = {};

  let hardIdx = 0, softIdx = 0;

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const tag = b1Result.tags[i];
    const isHard = req.classification === 'HARD_REQUIREMENT';

    const classification: NodeClassification = isHard ? 'HARD_CORE' : 'ORGANIZATIONAL';
    const weight: NodeWeight = isHard ? 'CRITICAL_STAR' : 'STRONG_TILDE';

    const section = isHard ? 1 : 2;
    const subIdx = isHard ? ++hardIdx : ++softIdx;
    const address = `${section}.${subIdx}`;
    const node_id = `node.req.${isHard ? 'hard' : 'soft'}.${String(subIdx).padStart(2, '0')}`;

    nodes[node_id] = {
      node_id,
      address,
      label: req.label,
      classification,
      weight,
      source_trace: {
        tag_id: tag.tag_id,
        source_match: tag.source_match,
        span_start: tag.span_start,
        span_end: tag.span_end,
        source_excerpt: tag.source_excerpt,
      },
    };
  }

  // Extract root role from requirements or envelope
  const root_role = envelope.A_scout.requirements_taxonomy[0]?.label
    ? `Target Role: ${envelope.Z_state.target_id}`
    : envelope.Z_state.target_id;

  // Hash the frozen tree
  const treeForHash = { root_role, nodes };
  const frozen_tree_sha256 = await sha256(deterministicStringify(treeForHash));

  const nodeList = Object.values(nodes);

  return {
    root_role,
    nodes,
    frozen_tree_sha256,
    receipt: {
      stage: 'B2',
      timestamp: new Date().toISOString(),
      node_count: nodeList.length,
      hard_core_count: nodeList.filter(n => n.classification === 'HARD_CORE').length,
      organizational_count: nodeList.filter(n => n.classification === 'ORGANIZATIONAL').length,
      frozen_tree_sha256,
    },
  };
}
