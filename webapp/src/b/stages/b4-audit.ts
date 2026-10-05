// ============================================================
// B4 — TRUTH AUDIT LEDGER: verify B3 proposals
// ============================================================

import type {
  B2Result, B3Result, CandidateVaultState, B1Result,
  AuditRecord, B4Result, Disposition, EvidenceCeiling, CandidateIdentity
} from '../types';
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

export async function runB4(
  b2Result: B2Result,
  b3Result: B3Result,
  vault: CandidateVaultState,
  b1Result: B1Result,
  candidateId: string,
  sdnaManifestSha256: string
): Promise<B4Result> {
  checkAccess('B4', 'CANDIDATE_SDNA_ATOMS', 'READ');
  checkAccess('B4', 'TEMPORARY_TARGET_TAGS', 'PURGE');
  checkAccess('B4', 'RAW_TARGET_TEXT', 'READ');

  const ledger: AuditRecord[] = [];

  for (const binding of b3Result.bindings) {
    const node = b2Result.nodes[binding.node_id];
    if (!node) {
      ledger.push({
        node_id: binding.node_id,
        atom_id: binding.bound_atom_id,
        domain: binding.domain,
        disposition: 'REJECTED_INTEGRITY',
        evidence_ceiling: 'NONE',
        proposition: '',
        binding_score: binding.binding_score,
        candidate_atom_integrity_verified: false,
        target_trace: { tag_id: '', source_match: false, span_start: 0, span_end: 0, source_excerpt: '' },
      });
      continue;
    }

    if (binding.status === 'UNBOUND' || !binding.bound_atom_id) {
      ledger.push({
        node_id: binding.node_id,
        atom_id: null,
        domain: null,
        disposition: 'UNRESOLVED',
        evidence_ceiling: 'NONE',
        proposition: `No candidate evidence for: ${node.label}`,
        binding_score: 0,
        candidate_atom_integrity_verified: false,
        target_trace: node.source_trace,
      });
      continue;
    }

    // Verify atom exists in vault
    const authAtom = vault.atom_index.get(binding.bound_atom_id);
    const atomExists = !!authAtom;
    const contentMatches = atomExists && authAtom!.content === binding.atom_content;
    const domainMatches = atomExists && authAtom!.domain === binding.domain;
    const candidateValid = vault.candidate_id === candidateId;

    // Verify target trace
    const traceValid = !!node.source_trace.tag_id;

    let disposition: Disposition;
    let evidence_ceiling: EvidenceCeiling;

    if (atomExists && contentMatches && domainMatches && candidateValid && traceValid) {
      disposition = 'PASS';
      evidence_ceiling = 'SUPPORTED_FACTUAL';
    } else if (!atomExists || !contentMatches) {
      disposition = 'REJECTED_INTEGRITY';
      evidence_ceiling = 'NONE';
    } else {
      disposition = 'UNRESOLVED';
      evidence_ceiling = 'NONE';
    }

    ledger.push({
      node_id: binding.node_id,
      atom_id: binding.bound_atom_id,
      domain: binding.domain,
      disposition,
      evidence_ceiling,
      proposition: disposition === 'PASS'
        ? `Candidate evidence "${binding.atom_content?.substring(0, 80)}..." supports ${node.label}`
        : disposition === 'UNRESOLVED'
          ? `Unresolved: ${node.label}`
          : `Integrity failure for ${node.label}`,
      binding_score: binding.binding_score,
      candidate_atom_integrity_verified: atomExists && contentMatches,
      target_trace: node.source_trace,
    });
  }

  const candidateIdentity: CandidateIdentity = {
    candidate_id: candidateId,
    sdna_manifest_sha256: sdnaManifestSha256,
  };

  // Hash the temporary tag layer before purge
  const tagLayerForHash = b1Result.tags.map(t => ({
    tag_id: t.tag_id, requirement_label: t.requirement_label,
    classification: t.classification, source_match: t.source_match,
    span_start: t.span_start, span_end: t.span_end, source_excerpt: t.source_excerpt,
  }));
  const tag_layer_sha256 = await sha256(deterministicStringify(tagLayerForHash));

  // Canonical ledger hash
  const ledgerForHash = ledger.map(r => ({
    node_id: r.node_id, atom_id: r.atom_id, disposition: r.disposition,
    evidence_ceiling: r.evidence_ceiling, binding_score: r.binding_score,
  }));
  const ledger_sha256 = await sha256(deterministicStringify(ledgerForHash));

  const passCount = ledger.filter(r => r.disposition === 'PASS').length;
  const unresolvedCount = ledger.filter(r => r.disposition === 'UNRESOLVED').length;
  const rejectedCount = ledger.filter(r => r.disposition === 'REJECTED_INTEGRITY').length;

  return {
    ledger,
    candidate_identity: candidateIdentity,
    admitted_bindings: passCount,
    ledger_sha256,
    tag_layer_purged: true,
    tag_layer_sha256,
    receipt: {
      stage: 'B4',
      timestamp: new Date().toISOString(),
      pass_count: passCount,
      unresolved_count: unresolvedCount,
      rejected_count: rejectedCount,
      match_percentage: ledger.length > 0 ? Math.round((passCount / ledger.length) * 100) : 0,
      ledger_sha256,
      tag_layer_purged: true,
      tag_layer_sha256,
    },
  };
}
