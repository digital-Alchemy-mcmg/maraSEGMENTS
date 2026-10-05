import React, { useState, useCallback } from 'react';
import type { BContext, StageName } from './b/types';
import {
  executeB1, sealB1, executeB2, freezeB2,
  executeB3, sealB3, executeB4, sealB4, executeB5, sealB5,
  runCompleteB
} from './b/engine';
import { downloadFile } from '@amzn/quick-pages-runtime-lib';
import { generateParachute, type ParachuteResult } from './b/parachute/parachute-engine';
import BIngress from './components/b/BIngress';
import B1Inspector from './components/b/B1Inspector';
import B2TreeView from './components/b/B2TreeView';
import B3BindingView from './components/b/B3BindingView';
import B4AuditView from './components/b/B4AuditView';
import B5ProjectionView from './components/b/B5ProjectionView';
import TraceHandoff from './components/b/TraceHandoff';
import BTestHarness from './components/b/BTestHarness';
import BCodeInspector from './components/b/BCodeInspector';
import { COLORS, STATUS_COLORS, btn, basePanel, mono } from './components/b/styles';

const TABS = ['INGRESS', 'B1 — DECOUPLE', 'B2 — TARGET TREE', 'B3 — EVIDENCE BINDING',
  'B4 — TRUTH AUDIT', 'B5 — FIVE-PRISM', 'TRACE / HANDOFF', 'TEST HARNESS', 'CODE INSPECTOR'] as const;

const STAGES: StageName[] = ['INGRESS', 'B1', 'B2', 'B3', 'B4', 'B5', 'T06', 'EXPORT'];

const INVARIANTS = [
  'NO EVIDENCE IS CREATED IN B',
  'TARGET AUTHORITY AND CANDIDATE AUTHORITY REMAIN DISTINCT',
  'B3 CANNOT SEE RAW TARGET SOURCE',
  'B5 CANNOT SEE RAW TARGET OR RAW SDNA',
  'EVERY C-VISIBLE PROPOSITION RESOLVES TO B4 → B3 → B2',
  'UNRESOLVED REQUIREMENTS NEVER BECOME CANDIDATE CLAIMS',
  'UPSTREAM A STATE IS APPEND-ONLY',
  'C RECEIVES NO SIDECAR AND NO SDNA VAULT',
  'NO AI / NO LLM IN B RUNTIME SEMANTICS',
];

export default function App() {
  const [ctx, setCtx] = useState<BContext | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [fullRunning, setFullRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArch, setShowArch] = useState(false);
  const [parachuteStatus, setParachuteStatus] = useState<'READY' | 'GENERATING' | 'DONE' | 'FAILED'>('READY');
  const [parachuteResult, setParachuteResult] = useState<ParachuteResult | null>(null);

  const updateCtx = useCallback((updated: BContext) => {
    setCtx({ ...updated });
  }, []);

  const onContextCreated = useCallback((c: BContext) => {
    setCtx({ ...c });
    setActiveTab(1);
  }, []);

  const handleStageAction = useCallback(async (action: string) => {
    if (!ctx) return;
    setError(null);
    try {
      let updated: BContext;
      switch (action) {
        case 'RUN_B1': updated = await executeB1({ ...ctx }); break;
        case 'SEAL_B1': updated = sealB1({ ...ctx }); setActiveTab(2); break;
        case 'RUN_B2': updated = await executeB2({ ...ctx }); break;
        case 'FREEZE_B2': updated = freezeB2({ ...ctx }); setActiveTab(3); break;
        case 'RUN_B3': updated = executeB3({ ...ctx }); break;
        case 'SEAL_B3': updated = sealB3({ ...ctx }); setActiveTab(4); break;
        case 'RUN_B4': updated = await executeB4({ ...ctx }); break;
        case 'SEAL_B4': updated = sealB4({ ...ctx }); setActiveTab(5); break;
        case 'RUN_B5': updated = executeB5({ ...ctx }); break;
        case 'SEAL_B5': updated = sealB5({ ...ctx }); setActiveTab(6); break;
        default: return;
      }
      setCtx({ ...updated });
    } catch (e: any) {
      setError(e.message);
    }
  }, [ctx]);

  const handleFullRun = useCallback(async () => {
    if (!ctx) return;
    setFullRunning(true);
    setError(null);
    try {
      const result = await runCompleteB({ ...ctx });
      setCtx({ ...result });
      setActiveTab(6);
    } catch (e: any) { setError(e.message); }
    finally { setFullRunning(false); }
  }, [ctx]);

  const handleParachute = useCallback(async () => {
    setParachuteStatus('GENERATING');
    setParachuteResult(null);
    setError(null);
    try {
      const runtimeState = ctx ? {
        run_id: ctx.identity.run_id,
        target_id: ctx.identity.target_id,
        candidate_id: ctx.identity.candidate_id,
        current_stage: Object.entries(ctx.stageProgression).find(([, v]) => v === 'RUNNING')?.[0] || 'IDLE',
        status: ctx.stageProgression.EXPORT === 'PASS' ? 'COMPLETE' : 'IN_PROGRESS',
        errors: ctx.errors,
      } : undefined;

      const result = await generateParachute(runtimeState);
      setParachuteResult(result);

      if (result.status === 'PASS') {
        await downloadFile(result.filename, result.zipBlob);
        setParachuteStatus('DONE');
      } else {
        setParachuteStatus('FAILED');
        setError('Parachute self-test failed: ' + result.self_test_results.filter(t => !t.passed).map(t => t.check).join(', '));
      }
    } catch (e: any) {
      setParachuteStatus('FAILED');
      setError(e.message);
    }
  }, [ctx]);

  const prog = ctx?.stageProgression;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: 14 }}>

      {/* Header */}
      <div style={{ background: '#0f172a', borderBottom: `1px solid ${COLORS.panelBorder}`, padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.textBright }}>SEGMENT B</span>
            <span style={{ color: COLORS.textDim, marginLeft: 12, fontSize: 12 }}>SPATIAL DNA PIPELINE — APP-IN-FLOW</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(COLORS.warn, !ctx || fullRunning)} disabled={!ctx || fullRunning} onClick={handleFullRun}>
              {fullRunning ? '⏳ RUNNING...' : '⚡ RUN FULL B CYCLE'}
            </button>
            <button style={btn('#6366f1', parachuteStatus === 'GENERATING')} onClick={handleParachute} disabled={parachuteStatus === 'GENERATING'}>
              🪂 {parachuteStatus === 'GENERATING' ? 'GENERATING...' : parachuteStatus === 'DONE' ? 'PARACHUTE READY ✓' : parachuteStatus === 'FAILED' ? 'PARACHUTE FAILED ✗' : 'EXPORT PARACHUTE'}
            </button>
            <button style={btn(COLORS.panelBorder)} onClick={() => setShowArch(!showArch)}>
              {showArch ? '✕' : '🏗'} ARCH
            </button>
          </div>
        </div>

        {prog && (
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {STAGES.map(s => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ background: STATUS_COLORS[prog[s]] + '33', border: `2px solid ${STATUS_COLORS[prog[s]]}`,
                  borderRadius: 4, padding: '4px 0', fontSize: 11, fontWeight: 600, color: STATUS_COLORS[prog[s]] }}>
                  {s}
                </div>
                <div style={{ fontSize: 9, color: STATUS_COLORS[prog[s]], marginTop: 2 }}>{prog[s]}</div>
              </div>
            ))}
          </div>
        )}

        {ctx && (
          <div style={{ ...mono, fontSize: 10, color: COLORS.textDim, marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>run: {ctx.identity.run_id}</span>
            <span>candidate: {ctx.identity.candidate_id}</span>
            <span>target: {ctx.identity.target_id}</span>
            <span>v{ctx.identity.pipeline_version}</span>
          </div>
        )}
      </div>

      {/* Architecture Diagram */}
      {showArch && (
        <div style={{ ...basePanel, margin: '12px 20px', background: COLORS.code }}>
          <pre style={{ ...mono, color: COLORS.text, fontSize: 11, lineHeight: 1.6, margin: 0, overflow: 'auto' }}>
{`                    SEGMENT B — APP-IN-FLOW

SEALED A ENVELOPE ────────┐
                           │
STATIONARY SIDECAR ────────┼──► INGRESS / CONTINUITY GATE
                           │
SDNA AUTHORITY ────────────┘
                                  │
                                  ▼
                           B1 — DECOUPLE (TARGET ONLY)
                                  │  STOP
                                  ▼
                           B2 — TARGET TREE (TARGET ONLY)
                                  │  STOP
                                  ▼
CandidateVault ─────────► B3 — EVIDENCE BINDING (NO SIDECAR)
                                  │  STOP
                                  ▼
CandidateVault ─────────► B4 — TRUTH AUDIT
Target trace ───────────►        │  STOP
                                  ▼
                           B5 — FIVE PRISMS (NO SIDECAR, NO SDNA)
                                  │  STOP
                                  ▼
                           T06 VERIFIER
                                  ▼
                       TERMINATE → SEAL → C1 READINESS
                                  ▼
                       SEALED_B_ENVELOPE → C1`}
          </pre>
        </div>
      )}

      {/* Parachute Result */}
      {parachuteResult && (
        <div style={{ ...basePanel, margin: '12px 20px', borderColor: parachuteResult.status === 'PASS' ? COLORS.success : COLORS.fail }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: parachuteResult.status === 'PASS' ? COLORS.success : COLORS.fail }}>
              🪂 PARACHUTE {parachuteResult.status}
            </span>
            <button style={{ ...btn(COLORS.panelBorder), padding: '2px 8px', fontSize: 11 }} onClick={() => setParachuteResult(null)}>✕</button>
          </div>
          <div style={{ ...mono, fontSize: 11, lineHeight: 1.8, color: COLORS.text }}>
            <div>{parachuteResult.filename}</div>
            <div>SHA-256: <span style={{ color: COLORS.accent }}>{parachuteResult.archive_sha256}</span></div>
            <div>{parachuteResult.included_files_count} files</div>
            <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textDim }}>
              Manifest: {parachuteResult.manifest_validation} | Path traversal: {parachuteResult.path_traversal} |
              Source mutation: {parachuteResult.source_mutation} | B isolation: {parachuteResult.normal_b_isolation} |
              Missing imports: {parachuteResult.missing_imported_files.length}
            </div>
          </div>
          <div style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto' }}>
            {parachuteResult.self_test_results.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, padding: '1px 0', fontFamily: 'monospace' }}>
                <span style={{ color: t.passed ? COLORS.success : COLORS.fail, minWidth: 36 }}>{t.passed ? 'PASS' : 'FAIL'}</span>
                <span style={{ color: COLORS.text, minWidth: 180 }}>{t.check}</span>
                <span style={{ color: COLORS.textDim }}>{t.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invariants Bar */}
      <div style={{ background: '#0c0f1a', borderBottom: `1px solid ${COLORS.panelBorder}`, padding: '6px 20px',
        display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto' }}>
        {INVARIANTS.map(inv => (
          <span key={inv} style={{ fontSize: 9, color: COLORS.warn, whiteSpace: 'nowrap', padding: '2px 6px',
            background: COLORS.warn + '11', borderRadius: 3 }}>
            {inv}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.panelBorder}`, background: '#0f172a', overflow: 'auto' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            style={{ padding: '10px 14px', border: 'none', borderBottom: activeTab === i ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              background: 'none', color: activeTab === i ? COLORS.textBright : COLORS.textDim,
              fontSize: 12, fontWeight: activeTab === i ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {error && (
          <div style={{ ...basePanel, borderColor: COLORS.fail, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: COLORS.fail, fontSize: 13, flex: 1 }}>❌ {error}</span>
            <button style={{ ...btn(COLORS.panelBorder), padding: '2px 8px', fontSize: 11 }} onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {activeTab === 0 && <BIngress onContextCreated={onContextCreated} />}

        {activeTab === 1 && (
          <div>
            <B1Inspector result={ctx?.b1Result} />
            {ctx && ctx.stageProgression.B1 === 'READY' && (
              <button style={{ ...btn(COLORS.accent), marginTop: 12 }} onClick={() => handleStageAction('RUN_B1')}>▶ RUN B1</button>
            )}
            {ctx && ctx.stageProgression.B1 === 'PASS' && (
              <button style={{ ...btn(COLORS.sealed), marginTop: 12 }} onClick={() => handleStageAction('SEAL_B1')}>🔒 SEAL B1 / CONTINUE TO B2</button>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <B2TreeView result={ctx?.b2Result} />
            {ctx && ctx.stageProgression.B2 === 'READY' && (
              <button style={{ ...btn(COLORS.accent), marginTop: 12 }} onClick={() => handleStageAction('RUN_B2')}>▶ RUN B2</button>
            )}
            {ctx && ctx.stageProgression.B2 === 'PASS' && (
              <button style={{ ...btn(COLORS.sealed), marginTop: 12 }} onClick={() => handleStageAction('FREEZE_B2')}>❄ FREEZE B2 / CONTINUE TO B3</button>
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <B3BindingView result={ctx?.b3Result} />
            {ctx && ctx.stageProgression.B3 === 'READY' && (
              <button style={{ ...btn(COLORS.accent), marginTop: 12 }} onClick={() => handleStageAction('RUN_B3')}>▶ RUN B3</button>
            )}
            {ctx && ctx.stageProgression.B3 === 'PASS' && (
              <button style={{ ...btn(COLORS.sealed), marginTop: 12 }} onClick={() => handleStageAction('SEAL_B3')}>🔒 SEAL B3 / CONTINUE TO B4</button>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div>
            <B4AuditView result={ctx?.b4Result} />
            {ctx && ctx.stageProgression.B4 === 'READY' && (
              <button style={{ ...btn(COLORS.accent), marginTop: 12 }} onClick={() => handleStageAction('RUN_B4')}>▶ RUN B4</button>
            )}
            {ctx && ctx.stageProgression.B4 === 'PASS' && (
              <button style={{ ...btn(COLORS.sealed), marginTop: 12 }} onClick={() => handleStageAction('SEAL_B4')}>🔒 SEAL B4 / CONTINUE TO B5</button>
            )}
          </div>
        )}

        {activeTab === 5 && (
          <div>
            <B5ProjectionView result={ctx?.b5Result} />
            {ctx && ctx.stageProgression.B5 === 'READY' && (
              <button style={{ ...btn(COLORS.accent), marginTop: 12 }} onClick={() => handleStageAction('RUN_B5')}>▶ RUN B5</button>
            )}
            {ctx && ctx.stageProgression.B5 === 'PASS' && (
              <button style={{ ...btn(COLORS.sealed), marginTop: 12 }} onClick={() => handleStageAction('SEAL_B5')}>🔒 SEAL B5 / RUN T06</button>
            )}
          </div>
        )}

        {activeTab === 6 && ctx && <TraceHandoff ctx={ctx} setCtx={updateCtx} />}
        {activeTab === 6 && !ctx && <div style={{ color: COLORS.textDim }}>Complete stages B1-B5 first.</div>}
        {activeTab === 7 && <BTestHarness />}
        {activeTab === 8 && <BCodeInspector />}
      </div>
    </div>
  );
}
