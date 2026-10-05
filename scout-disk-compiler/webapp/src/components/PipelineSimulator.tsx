// ═══════════════════════════════════════════════════════════════
// Scout — Pipeline Simulator (ENVOY 1 + ENVOY 2)
// ENVOY 2 is now a pure Code/Script Step running
// decomposeDescription() — zero AI, zero LLM.
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import type { Cartridge, CandidateJob, GateResult, CanonicalRow, TravelingEnvelope, EnvelopeFact } from './types';
import { haversineDistance, computeDedupKey, sha256 } from './compiler';
import { decomposeDescription, type DecompResult } from './decomposition-engine';
import { base, colors } from './styles';

interface Props {
  cartridge: Cartridge | null;
}

const SAMPLE_CANDIDATES: CandidateJob[] = [
  {
    title: 'Senior Software Engineer', employer: 'Acme Corp', city: 'Denver', state: 'CO', zip: '80202',
    lat: 39.7392, lon: -104.9903, naics_code: '541511', soc_code: '15-1252',
    source_url: 'https://jobs.acme.com/senior-swe-123', employment_type: 'Full-time',
    compensation: '$130,000 - $170,000/year', vendor: 'jobs.acme.com', is_active: true,
    description: 'We are looking for a Senior Software Engineer with 5+ years of experience in Python, React, and FastAPI. Must have experience with distributed systems and Docker. AWS certification preferred. Full-time position with benefits including health insurance, 401k matching, and remote work options. Requires ability to work in an agile environment. Security clearance is a plus. Monday through Friday, flexible schedule. Available to work overtime as needed.',
  },
  {
    title: 'Volunteer Coordinator', employer: 'Nonprofit Inc', city: 'Denver', state: 'CO', zip: '80203',
    lat: 39.7312, lon: -104.9826, naics_code: '541511', soc_code: '15-1252',
    source_url: 'https://volunteer.org/coord-456', employment_type: 'Volunteer',
    compensation: 'Unpaid', vendor: 'volunteer.org', is_active: true,
    description: 'Join our unpaid volunteer program to help coordinate community events.',
  },
  {
    title: 'Data Analyst', employer: 'TechStart LLC', city: 'Boulder', state: 'CO', zip: '80301',
    lat: 40.0150, lon: -105.2705, naics_code: '541511', soc_code: '15-2051',
    source_url: 'https://techstart.io/jobs/data-analyst', employment_type: 'Full-time',
    compensation: '$95,000/year', vendor: 'techstart.io', is_active: true,
    description: 'Looking for a Data Analyst proficient in SQL, Python, and Tableau. 3+ years experience required. Bachelor\'s degree in Computer Science or related field preferred. Must be able to lift up to 25 lbs for occasional office moves. Hybrid work environment with travel up to 10%. Competitive salary with 401k and health insurance benefits.',
  },
  {
    title: 'React Developer', employer: 'Acme Corp', city: 'Denver', state: 'CO', zip: '80202',
    lat: 39.7392, lon: -104.9903, naics_code: '541511', soc_code: '15-1252',
    source_url: 'https://Jobs.Acme.com/Senior-SWE-123?ref=google', employment_type: 'Full-time',
    compensation: '$130,000 - $170,000/year', vendor: 'jobs.acme.com', is_active: true,
    description: 'Same Acme position, duplicate URL after normalization.',
  },
  {
    title: 'Remote Python Engineer', employer: 'FarAway Inc', city: 'Miami', state: 'FL', zip: '33101',
    lat: 25.7617, lon: -80.1918, naics_code: '541511', soc_code: '15-1252',
    source_url: 'https://faraway.com/python-eng', employment_type: 'Full-time',
    compensation: '$120,000/year', vendor: 'faraway.com', is_active: true,
    description: 'Python developer for remote team. Requires react and fastapi experience. Night shift required.',
  },
];

interface CandidateResult {
  candidate: CandidateJob;
  gates: GateResult[];
  accepted: boolean;
  canonical?: CanonicalRow;
  envelope?: TravelingEnvelope;
  dedupKey?: string;
  decomp?: DecompResult;
}

function QualifierBadge({ q }: { q: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    requirement: { bg: colors.errorBg, fg: colors.error },
    preference: { bg: colors.warningBg, fg: colors.warning },
    availability: { bg: colors.purpleBg, fg: colors.purple },
  };
  const c = map[q] || { bg: colors.surfaceAlt, fg: colors.textDim };
  return <span style={{ ...base.badge, fontSize: '9px', backgroundColor: c.bg, color: c.fg }}>{q}</span>;
}

function CategoryBadge({ cat }: { cat: string }) {
  return <span style={{ ...base.badge, backgroundColor: colors.cyanBg, color: colors.cyan, fontSize: '9px' }}>{cat}</span>;
}

function FlowDiagram() {
  return (
    <div style={{ ...base.card, padding: '16px', borderColor: colors.cyan, borderLeftWidth: '3px' }}>
      <div style={{ ...base.cardTitle, marginBottom: '12px', color: colors.cyan }}>
        🔄 Pipeline Flow — LLM Prompt Replaced by Code/Script Step
      </div>
      <pre style={{
        ...base.mono, color: colors.textDim, fontSize: '10px', lineHeight: 1.7, margin: 0, overflowX: 'auto',
      }}>{`┌───────────────────────────────────────────────────────────────────────────────────────┐
│  ENVOY 1 (12 Gates)              │  ENVOY 2 (Deterministic Code Step)                 │
│                                   │                                                     │
│  Candidate ──► G1..G9 (Filter)    │  ┌──────────────────────────────────────────────┐    │
│  Records       G10 (Dedup Key)    │  │  decomposeDescription(rawSourceText)         │    │
│                G11 (Batch Dedup)   │  │                                              │    │
│                G12 (Canonical Row) │  │  Raw Prose ──Rule 1──► Atomize               │    │
│                    │               │  │            ──Rule 2──► Strip Pronouns         │    │
│                    ▼               │  │            ──Rule 5──► Remove Fluff           │    │
│             Accepted Records ────►│  │            ──Classify─► 14 Categories         │    │
│                                   │  │            ──Rule 10─► Qualify (req/pref)      │    │
│                                   │  │            ──Rule 11─► Availability Override   │    │
│                                   │  │            ──Rule 9──► Deduplicate             │    │
│                                   │  └─────────────────────────┬────────────────────┘    │
│                                   │                             ▼                         │
│                                   │   path_b_semantic = {                                 │
│                                   │     categories: { ... },                              │
│                                   │     fact_table: [ {text, category, qualifier, trace} ]│
│                                   │     rule_log: [ ... ],                                │
│                                   │     total_facts: N                                    │
│                                   │   }                                                   │
│                                   │                             ▼                         │
│                                   │      Traveling Envelope v0.2 ──► Stage B (Handoff)    │
└───────────────────────────────────────────────────────────────────────────────────────────┘

★ ZERO AI   ★ ZERO LLM   ★ FULLY DETERMINISTIC   ★ SAME INPUT = SAME OUTPUT ALWAYS
★ Every rule is a named, exported, pure function — independently testable & inspectable`}</pre>
    </div>
  );
}

function QualifierChart({ facts }: { facts: DecompResult['facts'] }) {
  const counts = { requirement: 0, preference: 0, availability: 0 };
  facts.forEach(f => { counts[f.qualifier]++; });
  const total = facts.length || 1;
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {(Object.entries(counts) as [string, number][]).map(([q, n]) => (
        <div key={q} style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
            <span style={{ color: colors.textMuted, textTransform: 'capitalize' }}>{q}</span>
            <span style={{ color: colors.text, fontWeight: 700 }}>{n}</span>
          </div>
          <div style={{ height: '4px', backgroundColor: colors.surfaceAlt, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px', width: `${(n / total) * 100}%`,
              backgroundColor: q === 'requirement' ? colors.error : q === 'preference' ? colors.warning : colors.purple,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryChart({ facts }: { facts: DecompResult['facts'] }) {
  const counts: Record<string, number> = {};
  facts.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted.length > 0 ? sorted[0][1] : 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {sorted.map(([cat, n]) => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
          <span style={{ width: '100px', color: colors.textMuted, textAlign: 'right', flexShrink: 0 }}>{cat}</span>
          <div style={{ flex: 1, height: '10px', backgroundColor: colors.surfaceAlt, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', width: `${(n / max) * 100}%`, backgroundColor: colors.cyan }} />
          </div>
          <span style={{ width: '20px', color: colors.text, fontWeight: 700, flexShrink: 0 }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function DecompInspector({ decomp }: { decomp: DecompResult }) {
  const [viewMode, setViewMode] = useState<'facts' | 'log' | 'json'>('facts');
  const fluffDropped = decomp.rule_log.filter(l => l.includes('DROPPED')).length;
  const pronounStripped = decomp.rule_log.filter(l => l.includes('Rule 2:')).length;

  return (
    <div style={{ width: '100%', marginTop: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
        {([
          ['Total Facts', decomp.total_facts, colors.cyan],
          ['Fluff Dropped', fluffDropped, colors.warning],
          ['Pronouns Stripped', pronounStripped, colors.purple],
          ['Categories Used', Object.keys(decomp.categories).length, colors.success],
        ] as [string, number, string][]).map(([label, val, clr]) => (
          <div key={label} style={{ padding: '8px', backgroundColor: '#050810', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: clr }}>{val}</div>
            <div style={{ fontSize: '9px', color: colors.textMuted, textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div style={{ padding: '10px', backgroundColor: '#050810', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textMuted, marginBottom: '6px' }}>QUALIFIER DISTRIBUTION</div>
          <QualifierChart facts={decomp.facts} />
        </div>
        <div style={{ padding: '10px', backgroundColor: '#050810', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textMuted, marginBottom: '6px' }}>CATEGORY DISTRIBUTION</div>
          <CategoryChart facts={decomp.facts} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {(['facts', 'log', 'json'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            ...base.btn, padding: '4px 12px', fontSize: '11px',
            backgroundColor: viewMode === m ? colors.purple : colors.surfaceAlt,
            color: viewMode === m ? '#fff' : colors.textDim,
          }}>
            {m === 'facts' ? '📋 Fact Table' : m === 'log' ? '📜 Rule Log' : '{ } JSON Output'}
          </button>
        ))}
      </div>

      {viewMode === 'facts' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: colors.textMuted, width: '30px' }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: colors.textMuted }}>Category</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: colors.textMuted }}>Qualifier</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: colors.textMuted }}>Atomic Fact</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: colors.textMuted }}>Rule Trace Chain</th>
              </tr>
            </thead>
            <tbody>
              {decomp.facts.map((f, fi) => (
                <tr key={fi} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: fi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '5px 8px', color: colors.textMuted }}>{fi + 1}</td>
                  <td style={{ padding: '5px 8px' }}><CategoryBadge cat={f.category} /></td>
                  <td style={{ padding: '5px 8px' }}><QualifierBadge q={f.qualifier} /></td>
                  <td style={{ padding: '5px 8px', color: colors.text, maxWidth: '350px', lineHeight: 1.4 }}>{f.text}</td>
                  <td style={{ padding: '5px 8px', ...base.mono, fontSize: '10px', color: colors.textMuted }}>{f.rule_trace.join(' → ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'log' && (
        <div style={{ padding: '10px', backgroundColor: '#050810', borderRadius: '6px', border: `1px solid ${colors.border}`, maxHeight: '300px', overflowY: 'auto' }}>
          {decomp.rule_log.map((line, li) => (
            <div key={li} style={{
              ...base.mono, fontSize: '11px', marginBottom: '2px', padding: '1px 4px', borderRadius: '2px',
              color: line.includes('DROPPED') ? colors.warning : line.startsWith('  ') ? colors.textMuted : colors.textDim,
              backgroundColor: line.includes('DROPPED') ? 'rgba(245,158,11,0.05)' : 'transparent',
            }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'json' && (
        <pre style={{
          ...base.mono, backgroundColor: '#050810', padding: '12px', borderRadius: '6px',
          border: `1px solid ${colors.border}`, maxHeight: '400px', overflowY: 'auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: '11px',
        }}>
          {JSON.stringify({
            categories: decomp.categories,
            fact_table: decomp.facts.map(f => ({ text: f.text, category: f.category, qualifier: f.qualifier, trace: f.rule_trace })),
            rule_log: decomp.rule_log,
            total_facts: decomp.total_facts,
          }, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function PipelineSimulator({ cartridge }: Props) {
  const [results, setResults] = useState<CandidateResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [activeEnvelope, setActiveEnvelope] = useState<number | null>(null);
  const [activeDecomp, setActiveDecomp] = useState<number | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);

  if (!cartridge || cartridge.certification.status !== 'CERTIFIED') {
    return (
      <div style={{ ...base.card, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <div style={{ fontSize: '16px', color: colors.textDim }}>Certified cartridge required.</div>
        <div style={{ fontSize: '13px', color: colors.textMuted, marginTop: '8px' }}>Compile and certify a disk in the Compiler tab first.</div>
      </div>
    );
  }

  const mp = cartridge.machine_payload;

  const runPipeline = async () => {
    setRunning(true);
    setActiveEnvelope(null);
    setActiveDecomp(null);
    const dedupSeen = new Map<string, number>();
    const allResults: CandidateResult[] = [];

    for (const cand of SAMPLE_CANDIDATES) {
      const gates: GateResult[] = [];
      let pass = true;

      const g1 = cand.vendor !== '';
      gates.push({ gate: 1, name: 'Observation Type', passed: g1, detail: `Expected: ${mp.obs_type}` });
      if (!g1) pass = false;

      gates.push({ gate: 2, name: 'Source Rule', passed: true, detail: `Vendor: ${cand.vendor}` });

      const g3 = !mp.exec.active_only || cand.is_active;
      gates.push({ gate: 3, name: 'Active Status', passed: g3, detail: cand.is_active ? 'Active' : 'Inactive' });
      if (!g3) pass = false;

      const hasCoords = !!mp.loc.ll;
      const dist = hasCoords ? haversineDistance(mp.loc.ll![0], mp.loc.ll![1], cand.lat, cand.lon) : 0;
      const g4 = !hasCoords || dist <= mp.loc.r;
      gates.push({ gate: 4, name: 'Territory Boundary', passed: g4, detail: hasCoords ? `${dist.toFixed(1)} mi (max ${mp.loc.r})` : 'ZIP-only territory (no coordinates — skipped)' });
      if (!g4) pass = false;

      const g5 = mp.tax.n.includes(cand.naics_code);
      gates.push({ gate: 5, name: 'NAICS Scope', passed: g5, detail: `${cand.naics_code} in [${mp.tax.n.join(', ')}]` });
      if (!g5) pass = false;

      const g6 = mp.tax.s.includes(cand.soc_code);
      gates.push({ gate: 6, name: 'SOC Scope', passed: g6, detail: `${cand.soc_code} in [${mp.tax.s.join(', ')}]` });
      if (!g6) pass = false;

      const g7 = cand.description.trim().length > 0;
      gates.push({ gate: 7, name: 'Keyword Blob', passed: g7, detail: `${cand.description.length} chars` });
      if (!g7) pass = false;

      const descLower = (cand.title + ' ' + cand.description).toLowerCase();
      const excluded = mp.kw_rules.exclude.find(term => descLower.includes(term.toLowerCase()));
      const g8 = !excluded;
      gates.push({ gate: 8, name: 'Global Exclusion', passed: g8, detail: excluded ? `Matched: "${excluded}"` : 'No exclusion matches' });
      if (!g8) pass = false;

      const scope = mp.kw_rules.role_scopes.find(s => s.target_soc === cand.soc_code);
      const g9 = !scope || scope.include.some(term => descLower.includes(term.toLowerCase()));
      gates.push({ gate: 9, name: 'Role Scope', passed: g9, detail: scope ? `Scope for ${scope.target_soc}` : 'No scope defined' });
      if (!g9) pass = false;

      const dedupKey = await computeDedupKey(cand.source_url, cand.employer);
      gates.push({ gate: 10, name: 'Dedup Key', passed: true, detail: dedupKey.substring(0, 16) + '...' });

      const prevCount = dedupSeen.get(dedupKey) || 0;
      dedupSeen.set(dedupKey, prevCount + 1);
      const g11 = !mp.exec.deduplicate || prevCount === 0;
      gates.push({ gate: 11, name: 'Batch Dedup', passed: g11, detail: prevCount > 0 ? `Duplicate #${prevCount + 1}` : 'First occurrence' });
      if (!g11) pass = false;

      gates.push({ gate: 12, name: 'Canonical Row', passed: pass, detail: pass ? 'Assembled' : 'Skipped (prior gate failed)' });

      let canonical: CanonicalRow | undefined;
      let envelope: TravelingEnvelope | undefined;
      let decomp: DecompResult | undefined;

      if (pass) {
        const obsId = 'OBS-' + dedupKey.substring(0, 12).toUpperCase();
        const naicsEntry = cartridge.definition.industry.find(i => i.code === cand.naics_code);
        canonical = {
          Observation_ID: obsId,
          Collection_Date: new Date().toISOString().split('T')[0],
          Vendor: cand.vendor,
          Employer: cand.employer,
          Job_Title: cand.title,
          City: cand.city,
          State: cand.state,
          ZIP: cand.zip,
          Industry: naicsEntry ? `${naicsEntry.code} — ${naicsEntry.title}` : cand.naics_code,
          Employment_Type: cand.employment_type,
          Compensation: cand.compensation,
          Source_URL: cand.source_url,
          Duplicate_Count: dedupSeen.get(dedupKey)!,
        };

        // ENVOY 2: Deterministic Code/Script Step — decomposeDescription()
        decomp = decomposeDescription(cand.description);
        const sourceHash = await sha256(cand.description);
        const now = new Date().toISOString();

        const factTable: EnvelopeFact[] = decomp.facts.map(f => ({
          text: f.text, category: f.category, qualifier: f.qualifier, trace: f.rule_trace,
        }));

        envelope = {
          $schema: 'https://json-schema.spatial-dna.org/v0.2/envelope.json',
          envelope_id: `ENV-${obsId}`,
          created_at: now,
          target_identity: { observation_id: obsId, employer: cand.employer, job_title: cand.title, deduplication_key: dedupKey },
          stage_state: { current_stage: 'b', completed_stages: ['scout'], status: 'ready' },
          append_history: [{ stage: 'scout', operation: 'initialize_and_append', timestamp: now }],
          payload: {
            scout: {
              path_a_structured: canonical,
              path_b_semantic: { categories: decomp.categories, fact_table: factTable, rule_log: decomp.rule_log, total_facts: decomp.total_facts },
              section_8_source: { source_text: cand.description, source_hash: `sha256:${sourceHash}`, capture_timestamp: now, is_preserved_source: true },
            },
            b: null, b1: null, b2: null, b3: null, b4: null, b5: null,
          },
        };

        allResults.push({ candidate: cand, gates, accepted: pass, canonical, envelope, dedupKey, decomp });
      } else {
        allResults.push({ candidate: cand, gates, accepted: pass, dedupKey });
      }
    }

    setResults(allResults);
    setRunning(false);
  };

  const accepted = results?.filter(r => r.accepted) || [];
  const rejected = results?.filter(r => !r.accepted) || [];
  const allFacts = accepted.flatMap(r => r.decomp?.facts || []);
  const totalFluff = accepted.reduce((acc, r) => acc + (r.decomp?.rule_log.filter(l => l.includes('DROPPED')).length || 0), 0);

  return (
    <div>
      {/* Launch */}
      <div style={{ ...base.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>🚀 Collection Pipeline Simulator</div>
          <div style={{ fontSize: '12px', color: colors.textDim, marginTop: '4px' }}>
            Cartridge: <span style={{ ...base.mono, color: colors.accent }}>{cartridge.metadata.cartridge_id}</span> •
            Profile: <span style={{ ...base.mono, color: colors.purple }}>{cartridge.definition.execution_profile}</span> •
            Candidates: <span style={{ ...base.mono }}>{SAMPLE_CANDIDATES.length}</span> •
            ENVOY 2: <span style={{ ...base.mono, color: colors.success }}>Code/Script Step (Zero AI)</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            style={{ ...base.btn, padding: '8px 14px', fontSize: '11px', backgroundColor: colors.cyanBg, color: colors.cyan, border: `1px solid ${colors.cyan}` }}
            onClick={() => setShowDiagram(!showDiagram)}
          >
            {showDiagram ? '▼ Hide' : '▶ Show'} Flow Diagram
          </button>
          <button
            style={{ ...base.btn, ...(running ? {} : base.btnPrimary), opacity: running ? 0.6 : 1 }}
            onClick={runPipeline}
            disabled={running}
          >
            {running ? '⏳ Running...' : '▶ Run Pipeline'}
          </button>
        </div>
      </div>

      {showDiagram && <FlowDiagram />}

      {results && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {([
              [accepted.length, 'Accepted', colors.success, colors.successBg],
              [rejected.length, 'Rejected', colors.error, colors.errorBg],
              [accepted.length, 'Envelopes', colors.cyan, colors.cyanBg],
              [allFacts.length, 'Total Facts', colors.purple, colors.purpleBg],
              [totalFluff, 'Fluff Dropped', colors.warning, colors.warningBg],
            ] as [number, string, string, string][]).map(([val, label, fg, bg]) => (
              <div key={label} style={{ ...base.card, textAlign: 'center', backgroundColor: bg, borderColor: fg }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: fg }}>{val}</div>
                <div style={{ fontSize: '11px', color: colors.textDim }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Batch Aggregate */}
          {allFacts.length > 0 && (
            <div style={{ ...base.card, padding: '16px' }}>
              <div style={{ ...base.cardTitle, marginBottom: '12px' }}>📊 Batch Decomposition Aggregate</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '8px' }}>QUALIFIER BREAKDOWN (ALL ACCEPTED)</div>
                  <QualifierChart facts={allFacts} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '8px' }}>CATEGORY DISTRIBUTION (ALL ACCEPTED)</div>
                  <CategoryChart facts={allFacts} />
                </div>
              </div>
            </div>
          )}

          {/* Candidate Results */}
          {results.map((r, i) => (
            <div key={i} style={{ ...base.card, borderColor: r.accepted ? colors.success : colors.error, borderLeftWidth: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{r.candidate.title}</div>
                  <div style={{ fontSize: '12px', color: colors.textDim }}>
                    {r.candidate.employer} • {r.candidate.city}, {r.candidate.state}
                    {r.decomp && <span style={{ color: colors.purple, marginLeft: '8px' }}>• {r.decomp.total_facts} facts decomposed</span>}
                  </div>
                </div>
                <span style={{
                  ...base.badge,
                  backgroundColor: r.accepted ? colors.successBg : colors.errorBg,
                  color: r.accepted ? colors.success : colors.error,
                }}>
                  {r.accepted ? 'ACCEPTED' : 'REJECTED'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '3px', marginBottom: '8px' }}>
                {r.gates.map(g => (
                  <div key={g.gate} title={`Gate ${g.gate}: ${g.name} — ${g.detail}`} style={{
                    padding: '4px', backgroundColor: g.passed ? colors.successBg : colors.errorBg,
                    borderRadius: '3px', textAlign: 'center', fontSize: '10px', cursor: 'default',
                  }}>
                    <span>{g.passed ? '✅' : '❌'}</span>
                    <div style={{ color: colors.textMuted, marginTop: '1px' }}>G{g.gate}</div>
                  </div>
                ))}
              </div>

              {r.gates.filter(g => !g.passed).map(g => (
                <div key={g.gate} style={{ fontSize: '11px', color: colors.error, marginBottom: '2px' }}>
                  Gate {g.gate} ({g.name}): {g.detail}
                </div>
              ))}

              {r.accepted && r.envelope && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    style={{ ...base.btn, padding: '4px 12px', fontSize: '11px', backgroundColor: colors.cyanBg, color: colors.cyan, border: `1px solid ${colors.cyan}` }}
                    onClick={() => setActiveEnvelope(activeEnvelope === i ? null : i)}
                  >
                    {activeEnvelope === i ? '▼ Hide' : '▶ View'} Envelope v0.2
                  </button>
                  {r.decomp && (
                    <button
                      style={{ ...base.btn, padding: '4px 12px', fontSize: '11px', backgroundColor: colors.purpleBg, color: colors.purple, border: `1px solid ${colors.purple}` }}
                      onClick={() => setActiveDecomp(activeDecomp === i ? null : i)}
                    >
                      {activeDecomp === i ? '▼ Hide' : '▶ Inspect'} Decomposition ({r.decomp.total_facts} facts)
                    </button>
                  )}

                  {activeEnvelope === i && (
                    <pre style={{
                      ...base.mono, width: '100%', backgroundColor: '#050810', padding: '12px', borderRadius: '6px',
                      border: `1px solid ${colors.border}`, maxHeight: '400px', overflowY: 'auto',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '4px 0 0 0', fontSize: '11px',
                    }}>
                      {JSON.stringify(r.envelope, null, 2)}
                    </pre>
                  )}

                  {activeDecomp === i && r.decomp && <DecompInspector decomp={r.decomp} />}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
