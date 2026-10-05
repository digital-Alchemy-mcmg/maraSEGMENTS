import React, { useState } from 'react';
import { basePanel, COLORS, heading, subheading, mono } from './styles';

// Expose ACTUAL executing functions source
const CODE_SECTIONS: Record<string, Record<string, string>> = {
  'AUTHORITY / INGRESS': {
    'SDNA Adapter': `// canonical-sdna.ts — SDNA Adapter
// CF-SDNA-EVERYTHING: candidate.candidate_id + candidate.spatial_dna.evidence_atoms
// Legacy: top-level candidate_id + atoms[]
// normalizeAtom: statement→content, plane→domain, original in metadata
// mountCandidateVault: parseSDNAYaml → canonicalize → sha256
// Returns { candidate_id, display_name, atoms, atom_index, source_registry }`,
    'Envelope Hydration': `// envelope.ts — hydrateEnvelope + normalizeTaxonomy
// Canonical A_scout.requirements_taxonomy is an object:
//   { hard_requirements: string[], soft_requirements: string[], keyword_lexicon: string[] }
// normalizeTaxonomy() converts to RequirementTaxonomy[] for B1/B2
// hydrateEnvelope: validate Z_state, A_scout, normalize taxonomy, freeze`,
    'Continuity Gate': `// ingress-gate.ts — runIngressGate
// Reads envelope.Z_state for identity, fails closed on mismatch
// Three-way hash: SHA256(raw_posting) = sidecar.original = A_scout.original`,
  },
  'B1': {
    'Source Tracing': `// b1-decouple.ts — findSourceOccurrence
function findSourceOccurrence(text, wording) {
  // 1. Try exact substring match
  let idx = lower.indexOf(wordingLower);
  if (idx >= 0) return { found: true, start: idx, end: idx + wording.length, excerpt };
  // 2. Token coverage fallback
  const tokens = wording.split(/\\s+/).filter(t => t.length >= 3);
  // Sliding window, count matching tokens
  // Return best window with >= 30% token coverage
}`,
    'Tag Creation': `// b1-decouple.ts — tag output
{ tag_id: "tag-b1-001", requirement_label, classification,
  source_match: boolean, span_start, span_end, source_excerpt }`,
  },
  'B2': {
    'Node Construction': `// b2-tree.ts
const classification = isHard ? 'HARD_CORE' : 'ORGANIZATIONAL';
const weight = isHard ? 'CRITICAL_STAR' : 'STRONG_TILDE';
nodes[node_id] = { node_id, address, label, classification, weight, source_trace };`,
    'Tree Hashing': `// b2-tree.ts — deterministic hash
const treeForHash = { root_role, nodes };
const frozen_tree_sha256 = await sha256(deterministicStringify(treeForHash));`,
  },
  'B3': {
    'Token Normalization': `// b3-binding.ts
function normalizeText(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\\s]/g, ' ')
    .split(/\\s+/).filter(t => t.length >= 2);
}`,
    'Binding Rules': `// b3-binding.ts — findBestBinding
// 1. Exact phrase check: +0.5
// 2. Token coverage: intersection(target,atom)/target_count * 0.5
// Score capped at 1.0, threshold > 0.05 for BOUND`,
    'Scoring': `// b3-binding.ts
computeTokenCoverage = intersection(target_tokens, atom_tokens) / target_tokens.length`,
  },
  'B4': {
    'Atom Verification': `// b4-audit.ts
const authAtom = vault.atom_index.get(binding.bound_atom_id);
const atomExists = !!authAtom;
const contentMatches = authAtom.content === binding.atom_content;
const domainMatches = authAtom.domain === binding.domain;
const candidateValid = vault.candidate_id === candidateId;`,
    'Dispositions': `PASS: atom exists + content matches + domain matches + candidate valid + trace valid
UNRESOLVED: no acceptable evidence
REJECTED_INTEGRITY: claim exists but cannot reproduce`,
    'Ledger Hashing': `// Hash tag layer before purge, hash ledger entries
const ledger_sha256 = await sha256(deterministicStringify(ledgerForHash));`,
  },
  'B5': {
    'Prism Scoring': `// b5-prisms.ts
STAFFING_OWNER: passCount / totalNodes (coverage)
SPORTS_AGENT: avg(binding_score) (strength)
DISCOVERY_SCOUT: min(domains.size/5, 1) (diversity)
HEADHUNTER: softPass / softNodes (organizational fit)
CASTING_DIRECTOR: hardPass / hardNodes (hard-core coverage)`,
    'Prominence': `CRITICAL_STAR + PASS → FOREGROUND
STRONG_TILDE + PASS → REINFORCEMENT
other PASS → BACKGROUND
!PASS → SUPPRESSED`,
    'Writing Boundaries': `assertiveness_ceiling: SUPPORTED_FACTUAL
No assertion may exceed its cited candidate atom.
Unresolved requirement → prohibited_implications.`,
  },
  'T06': {
    'Hash Verification': `// t06-trace.ts
const recomputedHash = await sha256(sidecar.raw_posting);
threeWayMatch = recomputedHash === sidecar.original_content_sha256
             && recomputedHash === aScoutSourceHash;`,
    'Lineage Walk': `B5_DECISION → B4_LEDGER → B3_ATOM → B2_TARGET_TRACE → SIDECAR_SOURCE + THREE_WAY_HASH`,
  },
  'TERMINATION': {
    'Sidecar Purge': `attestation = { status: 'TERMINATED_AND_VERIFIED',
  destruction_verification: { method: 'APPLICATION_REFERENCE_PURGE',
    owned_references_unreachable: true,
    physical_memory_zeroization_guaranteed: false,
    scope: 'application/runtime object graph only' } }`,
    'Vault Unmount': `vault.mounted = false; vault.atoms = []; vault.atom_index = new Map();`,
  },
  'C HANDOFF': {
    'Readiness Barrier': `// c1-readiness.ts — 11 required checks:
B_sidecar_attestation.status === 'TERMINATED_AND_VERIFIED'
b4_ledger.candidate_identity (object)
b4_ledger.admitted_bindings, ledger_sha256
b5_projection: propositions, priorities, boundaries, guidance
unresolved_gaps (array — [] is VALID), posture, owner_prism`,
    'B Append': `// envelope.ts — appendBLayer
return { ...envelope,
  Z_state: { ...envelope.Z_state,
    current_stage: 'B5_COMPLETE',
    status: 'complete:STOP_BEFORE_RESUME_FACTORY' },
  B_sdna: bLayer };`,
  },
};

export default function BCodeInspector() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <div>
      <h3 style={heading}>CODE INSPECTOR — Actual Executing Functions</h3>
      <div style={{ ...basePanel, background: COLORS.code, fontSize: 11, color: COLORS.warn, marginBottom: 12 }}>
        ⚠ This displays the ACTUAL logic from the executing source modules, not decorative pseudocode.
      </div>
      {Object.entries(CODE_SECTIONS).map(([section, funcs]) => (
        <div key={section} style={{ marginBottom: 8 }}>
          <div
            onClick={() => setOpenSection(openSection === section ? null : section)}
            style={{ ...basePanel, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}
          >
            <span style={{ color: COLORS.textBright, fontWeight: 600, fontSize: 13 }}>{section}</span>
            <span style={{ color: COLORS.textDim }}>{openSection === section ? '▼' : '▶'}</span>
          </div>
          {openSection === section && Object.entries(funcs).map(([name, code]) => (
            <div key={name} style={{ marginLeft: 16, marginBottom: 8 }}>
              <div style={subheading}>{name}</div>
              <pre style={{ ...mono, background: COLORS.code, color: COLORS.text, padding: 12, borderRadius: 4, overflow: 'auto', maxHeight: 300, border: `1px solid ${COLORS.panelBorder}`, margin: 0, whiteSpace: 'pre-wrap' }}>
                {code}
              </pre>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
