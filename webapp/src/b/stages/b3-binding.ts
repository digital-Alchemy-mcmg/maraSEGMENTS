// ============================================================
// B3 — EVIDENCE BINDING: candidate ↔ target node proposals
// ============================================================

import type { B2Result, CandidateVaultState, EvidenceBinding, B3Result, CompetencyNode, SDNAAtom } from '../types';
import { checkAccess } from '../authority/access-control';

function normalizeText(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

function computeTokenCoverage(targetTokens: string[], atomTokens: string[]): number {
  if (targetTokens.length === 0) return 0;
  const atomSet = new Set(atomTokens);
  const intersection = targetTokens.filter(t => atomSet.has(t));
  return intersection.length / targetTokens.length;
}

function findBestBinding(
  node: CompetencyNode,
  atoms: SDNAAtom[]
): { atom: SDNAAtom | null; score: number; basis: string[] } {
  const targetTokens = normalizeText(node.label + ' ' + (node.source_trace.source_excerpt || ''));

  let bestAtom: SDNAAtom | null = null;
  let bestScore = 0;
  let bestBasis: string[] = [];

  for (const atom of atoms) {
    const atomTokens = normalizeText(atom.content);
    let score = 0;
    const basis: string[] = [];

    // Exact phrase check
    const nodeLabel = node.label.toLowerCase().trim();
    if (atom.content.toLowerCase().includes(nodeLabel)) {
      score += 0.5;
      basis.push('EXACT_PHRASE');
    }

    // Token coverage
    const coverage = computeTokenCoverage(targetTokens, atomTokens);
    score += coverage * 0.5;
    if (coverage > 0) basis.push('TOKEN_COVERAGE');

    if (score > bestScore) {
      bestScore = score;
      bestAtom = atom;
      bestBasis = basis;
    }
  }

  return { atom: bestAtom, score: Math.min(bestScore, 1), basis: bestBasis };
}

export function runB3(
  b2Result: B2Result,
  vault: CandidateVaultState
): B3Result {
  // Access control: B3 can read CANDIDATE_SDNA_ATOMS only
  checkAccess('B3', 'CANDIDATE_SDNA_ATOMS', 'READ');

  const bindings: EvidenceBinding[] = [];
  const nodes = Object.values(b2Result.nodes);

  for (const node of nodes) {
    const { atom, score, basis } = findBestBinding(node, vault.atoms);

    if (atom && score > 0.05) {
      bindings.push({
        node_id: node.node_id,
        bound_atom_id: atom.atom_id,
        atom_content: atom.content,
        domain: atom.domain,
        binding_score: Math.round(score * 100) / 100,
        binding_basis: basis,
        status: 'BOUND',
      });
    } else {
      bindings.push({
        node_id: node.node_id,
        bound_atom_id: null,
        atom_content: null,
        domain: null,
        binding_score: 0,
        binding_basis: [],
        status: 'UNBOUND',
      });
    }
  }

  const bound = bindings.filter(b => b.status === 'BOUND').length;

  return {
    bindings,
    receipt: {
      stage: 'B3',
      timestamp: new Date().toISOString(),
      total_bindings: bindings.length,
      bound_count: bound,
      unbound_count: bindings.length - bound,
    },
  };
}
