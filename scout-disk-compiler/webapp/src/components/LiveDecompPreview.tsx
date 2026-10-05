// ═══════════════════════════════════════════════════════════════
// Live Decomposition Preview
// Operators paste a sample job posting and immediately inspect
// the resulting Fact Table, Rule Log, and structured output
// before running batch collection.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import {
  decomposeDescription,
  rule1_atomize,
  rule2_strip_pronouns,
  rule5_remove_fluff,
  rule10_classify_qualifier,
  rule11_is_availability,
  classify_category,
  rule9_deduplicate,
  type DecompResult,
  type AtomicFact,
} from './decomposition-engine';
import { base, colors } from './styles';

// ── Sample postings for quick load ──
const SAMPLES: Record<string, string> = {
  'Software Engineer': 'We are looking for a Senior Software Engineer with 5+ years of experience in Python, React, and FastAPI. Must have experience with distributed systems and Docker. AWS certification preferred. Full-time position with benefits including health insurance, 401k matching, and remote work options. Requires ability to work in an agile environment. Security clearance is a plus. Monday through Friday, flexible schedule. Available to work overtime as needed. Salary range $130,000 - $170,000/year. Bachelor\'s degree in Computer Science required. Join our fast-paced, innovative team!',
  'Warehouse Worker': 'Seeking full-time warehouse associate. Must be able to lift up to 50 lbs repeatedly. Forklift certification preferred. First shift, Monday through Friday 7:00 AM to 3:30 PM. Overtime on weekends as needed. $18/hour plus benefits. Health insurance and 401k after 90 days. High school diploma or GED required. Steel-toed boots and PPE provided. Must pass background check.',
  'Nurse Practitioner': 'Board-certified Nurse Practitioner needed for busy primary care clinic. Must have active NP license in Colorado. 3+ years experience in family medicine required. DEA registration necessary. Competitive salary $110,000 - $135,000 with malpractice insurance, CME allowance, and full benefits package including dental and vision. Hybrid schedule: 3 days in-office, 2 days telehealth. No nights or weekends. Epic EMR proficiency preferred.',
  'Marketing Manager': 'We need a Marketing Manager to lead our digital strategy. You will oversee a team of 5 marketing specialists. Must have proven track record in B2B SaaS marketing. 7+ years experience required. Proficiency in HubSpot, Google Analytics, and Salesforce. MBA preferred. Budget management experience of $2M+ essential. Remote-first with quarterly team meetups. Salary $95,000 - $120,000 plus equity and performance bonus.',
};

// ── Individual Rule Test Harness ──
function RuleTestHarness() {
  const [selectedRule, setSelectedRule] = useState<string>('rule1');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const rules = [
    { id: 'rule1', name: 'Rule 1: Atomize', desc: 'Split text into atomic sentences' },
    { id: 'rule2', name: 'Rule 2: Strip Pronouns', desc: 'Remove leading pronoun+verb patterns' },
    { id: 'rule5', name: 'Rule 5: Remove Fluff', desc: 'Strip marketing fluff (null = dropped)' },
    { id: 'rule10', name: 'Rule 10: Qualify', desc: 'Classify as requirement or preference' },
    { id: 'rule11', name: 'Rule 11: Availability', desc: 'Detect schedule/availability language' },
    { id: 'classify', name: 'Classify Category', desc: 'Map to one of 14 categories' },
  ];

  const runTest = useCallback(() => {
    if (!testInput.trim()) return;
    try {
      let result: string;
      switch (selectedRule) {
        case 'rule1': result = JSON.stringify(rule1_atomize(testInput), null, 2); break;
        case 'rule2': result = rule2_strip_pronouns(testInput); break;
        case 'rule5': { const r = rule5_remove_fluff(testInput); result = r === null ? 'null (DROPPED — entire sentence is fluff)' : r; break; }
        case 'rule10': result = rule10_classify_qualifier(testInput); break;
        case 'rule11': result = rule11_is_availability(testInput) ? 'true (availability)' : 'false (not availability)'; break;
        case 'classify': result = classify_category(testInput); break;
        default: result = 'Unknown rule';
      }
      setTestOutput(result);
    } catch (err) {
      setTestOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [selectedRule, testInput]);

  return (
    <div style={{ ...base.card, borderColor: colors.warning, borderLeftWidth: '3px' }}>
      <div style={base.cardTitle}>🧪 Individual Rule Test Harness</div>
      <div style={{ fontSize: '12px', color: colors.textDim, marginBottom: '12px' }}>
        Test any decomposition rule function independently with custom input.
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {rules.map(r => (
          <button key={r.id} onClick={() => { setSelectedRule(r.id); setTestOutput(null); }} title={r.desc} style={{
            ...base.btn, padding: '4px 10px', fontSize: '10px',
            backgroundColor: selectedRule === r.id ? colors.warning : colors.surfaceAlt,
            color: selectedRule === r.id ? '#000' : colors.textDim,
          }}>
            {r.name}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '6px' }}>
        {rules.find(r => r.id === selectedRule)?.desc}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <textarea
          style={{ ...base.textarea, flex: 1, minHeight: '40px', fontSize: '12px' }}
          value={testInput}
          onChange={e => setTestInput(e.target.value)}
          placeholder={selectedRule === 'rule1'
            ? 'Enter multi-sentence text to atomize...'
            : 'Enter a single sentence to test...'}
        />
        <button style={{ ...base.btn, ...base.btnPrimary, alignSelf: 'flex-start' }} onClick={runTest}>
          Run
        </button>
      </div>

      {testOutput !== null && (
        <pre style={{
          ...base.mono, backgroundColor: '#050810', padding: '10px', borderRadius: '6px',
          border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: '12px',
          color: testOutput.startsWith('null') ? colors.warning : testOutput.startsWith('Error') ? colors.error : colors.success,
        }}>
          {testOutput}
        </pre>
      )}
    </div>
  );
}

export default function LiveDecompPreview() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<DecompResult | null>(null);
  const [viewMode, setViewMode] = useState<'facts' | 'log' | 'json' | 'categories'>('facts');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterQualifier, setFilterQualifier] = useState<string>('all');

  const runDecomp = useCallback(() => {
    if (!inputText.trim()) return;
    const r = decomposeDescription(inputText);
    setResult(r);
    setFilterCategory('all');
    setFilterQualifier('all');
  }, [inputText]);

  const loadSample = (key: string) => {
    setInputText(SAMPLES[key]);
    setResult(null);
  };

  const filteredFacts = result ? result.facts.filter(f => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterQualifier !== 'all' && f.qualifier !== filterQualifier) return false;
    return true;
  }) : [];

  const categories = result ? Object.keys(result.categories) : [];
  const fluffDropped = result ? result.rule_log.filter(l => l.includes('DROPPED')).length : 0;
  const pronounStripped = result ? result.rule_log.filter(l => l.includes('Rule 2:')).length : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ ...base.card, borderColor: colors.purple, borderLeftWidth: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={base.cardTitle}>🔬 Live Decomposition Preview</div>
            <div style={{ fontSize: '12px', color: colors.textDim }}>
              Paste a job posting and inspect the deterministic decomposition output in real time.
              This runs the same <span style={{ ...base.mono, color: colors.purple }}>decomposeDescription()</span> Code/Script Step used by the pipeline.
            </div>
          </div>
          <span style={{ ...base.badge, backgroundColor: colors.successBg, color: colors.success }}>ZERO AI</span>
        </div>

        {/* Quick Load Samples */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>QUICK LOAD SAMPLE POSTINGS:</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {Object.keys(SAMPLES).map(key => (
              <button key={key} onClick={() => loadSample(key)} style={{
                ...base.btn, padding: '4px 10px', fontSize: '11px',
                backgroundColor: colors.surfaceAlt, color: colors.textDim, border: `1px solid ${colors.border}`,
              }}>
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <textarea
          style={{ ...base.textarea, minHeight: '120px', fontSize: '13px', marginBottom: '8px' }}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste a job description here..."
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            style={{ ...base.btn, ...base.btnPrimary, flex: 'none' }}
            onClick={runDecomp}
            disabled={!inputText.trim()}
          >
            ⚡ Decompose
          </button>
          <button
            style={{ ...base.btn, padding: '10px 20px', backgroundColor: colors.surfaceAlt, color: colors.textDim }}
            onClick={() => { setInputText(''); setResult(null); }}
          >
            Clear
          </button>
          {inputText && (
            <span style={{ fontSize: '11px', color: colors.textMuted }}>{inputText.length} chars</span>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {([
              [result.total_facts, 'Total Facts', colors.cyan, colors.cyanBg],
              [categories.length, 'Categories', colors.success, colors.successBg],
              [fluffDropped, 'Fluff Dropped', colors.warning, colors.warningBg],
              [pronounStripped, 'Pronouns Stripped', colors.purple, colors.purpleBg],
              [result.facts.filter(f => f.qualifier === 'availability').length, 'Availability', colors.purple, colors.purpleBg],
            ] as [number, string, string, string][]).map(([val, label, fg, bg]) => (
              <div key={label} style={{ ...base.card, textAlign: 'center', backgroundColor: bg, borderColor: fg }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: fg }}>{val}</div>
                <div style={{ fontSize: '10px', color: colors.textDim }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Qualifier + Category Distribution */}
          <div style={{ ...base.card }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '8px' }}>QUALIFIER DISTRIBUTION</div>
                {(['requirement', 'preference', 'availability'] as const).map(q => {
                  const count = result.facts.filter(f => f.qualifier === q).length;
                  const pct = result.total_facts > 0 ? (count / result.total_facts * 100).toFixed(0) : '0';
                  const clr = q === 'requirement' ? colors.error : q === 'preference' ? colors.warning : colors.purple;
                  return (
                    <div key={q} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ width: '90px', fontSize: '11px', color: colors.textMuted, textTransform: 'capitalize' }}>{q}</span>
                      <div style={{ flex: 1, height: '12px', backgroundColor: colors.surfaceAlt, borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: clr, borderRadius: '3px' }} />
                      </div>
                      <span style={{ width: '50px', fontSize: '11px', color: colors.text, fontWeight: 700, textAlign: 'right' }}>{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, marginBottom: '8px' }}>CATEGORY DISTRIBUTION</div>
                {Object.entries(result.categories).sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0)).map(([cat, items]) => {
                  const count = items?.length || 0;
                  const max = Math.max(...Object.values(result.categories).map(v => v?.length || 0), 1);
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ width: '110px', fontSize: '10px', color: colors.textMuted, textAlign: 'right' }}>{cat}</span>
                      <div style={{ flex: 1, height: '10px', backgroundColor: colors.surfaceAlt, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, backgroundColor: colors.cyan, borderRadius: '2px' }} />
                      </div>
                      <span style={{ width: '20px', fontSize: '11px', color: colors.text, fontWeight: 700 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* View Mode + Filters */}
          <div style={{ ...base.card, padding: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['facts', 'log', 'json', 'categories'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  ...base.btn, padding: '6px 14px', fontSize: '11px',
                  backgroundColor: viewMode === m ? colors.purple : colors.surfaceAlt,
                  color: viewMode === m ? '#fff' : colors.textDim,
                }}>
                  {m === 'facts' ? '📋 Fact Table' : m === 'log' ? '📜 Rule Log' : m === 'json' ? '{ } JSON' : '📦 By Category'}
                </button>
              ))}

              {viewMode === 'facts' && (
                <>
                  <span style={{ color: colors.border, margin: '0 4px' }}>|</span>
                  <select style={{ ...base.select, width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                    value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select style={{ ...base.select, width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                    value={filterQualifier} onChange={e => setFilterQualifier(e.target.value)}>
                    <option value="all">All Qualifiers</option>
                    <option value="requirement">Requirement</option>
                    <option value="preference">Preference</option>
                    <option value="availability">Availability</option>
                  </select>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>
                    Showing {filteredFacts.length} of {result.total_facts}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          {viewMode === 'facts' && (
            <div style={{ ...base.card, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: colors.textMuted, width: '30px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: colors.textMuted }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: colors.textMuted }}>Qualifier</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: colors.textMuted }}>Atomic Fact</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: colors.textMuted }}>Rule Trace Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacts.map((f, fi) => (
                    <tr key={fi} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: fi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '6px 8px', color: colors.textMuted }}>{fi + 1}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ ...base.badge, backgroundColor: colors.cyanBg, color: colors.cyan, fontSize: '10px' }}>{f.category}</span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          ...base.badge, fontSize: '10px',
                          backgroundColor: f.qualifier === 'requirement' ? colors.errorBg : f.qualifier === 'preference' ? colors.warningBg : colors.purpleBg,
                          color: f.qualifier === 'requirement' ? colors.error : f.qualifier === 'preference' ? colors.warning : colors.purple,
                        }}>{f.qualifier}</span>
                      </td>
                      <td style={{ padding: '6px 8px', color: colors.text, maxWidth: '400px', lineHeight: 1.4 }}>{f.text}</td>
                      <td style={{ padding: '6px 8px', ...base.mono, fontSize: '10px', color: colors.textMuted }}>{f.rule_trace.join(' → ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFacts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted }}>No facts match the current filters.</div>
              )}
            </div>
          )}

          {viewMode === 'log' && (
            <div style={{ ...base.card }}>
              <div style={{ padding: '12px', backgroundColor: '#050810', borderRadius: '6px', border: `1px solid ${colors.border}`, maxHeight: '500px', overflowY: 'auto' }}>
                {result.rule_log.map((line, li) => (
                  <div key={li} style={{
                    ...base.mono, fontSize: '12px', marginBottom: '2px', padding: '2px 6px', borderRadius: '2px',
                    color: line.includes('DROPPED') ? colors.warning : line.startsWith('  ') ? colors.textMuted : colors.textDim,
                    backgroundColor: line.includes('DROPPED') ? 'rgba(245,158,11,0.06)' : 'transparent',
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'json' && (
            <div style={{ ...base.card }}>
              <pre style={{
                ...base.mono, backgroundColor: '#050810', padding: '16px', borderRadius: '6px',
                border: `1px solid ${colors.border}`, maxHeight: '600px', overflowY: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: '12px',
              }}>
                {JSON.stringify({
                  categories: result.categories,
                  fact_table: result.facts.map(f => ({ text: f.text, category: f.category, qualifier: f.qualifier, trace: f.rule_trace })),
                  rule_log: result.rule_log,
                  total_facts: result.total_facts,
                }, null, 2)}
              </pre>
            </div>
          )}

          {viewMode === 'categories' && (
            <div>
              {Object.entries(result.categories).sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0)).map(([cat, items]) => (
                <div key={cat} style={{ ...base.card, borderLeftWidth: '3px', borderLeftColor: colors.cyan }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>{cat}</span>
                    <span style={{ ...base.badge, backgroundColor: colors.cyanBg, color: colors.cyan }}>{items?.length || 0} facts</span>
                  </div>
                  {(items || []).map((item, ii) => {
                    const fact = result.facts.find(f => f.text === item && f.category === cat);
                    return (
                      <div key={ii} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '12px' }}>
                        {fact && (
                          <span style={{
                            ...base.badge, fontSize: '9px', flexShrink: 0,
                            backgroundColor: fact.qualifier === 'requirement' ? colors.errorBg : fact.qualifier === 'preference' ? colors.warningBg : colors.purpleBg,
                            color: fact.qualifier === 'requirement' ? colors.error : fact.qualifier === 'preference' ? colors.warning : colors.purple,
                          }}>{fact.qualifier}</span>
                        )}
                        <span style={{ color: colors.text, flex: 1 }}>{item}</span>
                        {fact && (
                          <span style={{ ...base.mono, fontSize: '10px', color: colors.textMuted, flexShrink: 0 }}>
                            {fact.rule_trace.join(' → ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Rule Test Harness */}
      <RuleTestHarness />
    </div>
  );
}
