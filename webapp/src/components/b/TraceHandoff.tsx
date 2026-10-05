import React, { useState, useCallback } from 'react';
import type { BContext, TraceReceipt, SealedBEnvelope, GateBReceipt } from '../../b/types';
import { executeT06, finalizeB, exportBEnvelope, exportGateReceipt } from '../../b/engine';
import { buildAuditReport } from '../../b/contracts';
import { checkC1Readiness } from '../../b/verification/c1-readiness';
import { downloadFile } from '@amzn/quick-pages-runtime-lib';
import { basePanel, btn, COLORS, heading, badge, mono, subheading } from './styles';

interface Props {
  ctx: BContext;
  setCtx: (c: BContext) => void;
}

export default function TraceHandoff({ ctx, setCtx }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canRunT06 = ctx.stageProgression.T06 === 'READY';
  const t06Done = ctx.stageProgression.T06 === 'PASS';
  const exportReady = ctx.stageProgression.EXPORT === 'PASS';

  const handleT06 = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const updated = await executeT06({ ...ctx });
      setCtx(updated);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [ctx, setCtx]);

  const handleFinalize = useCallback(() => {
    setError(null);
    try {
      const updated = finalizeB({ ...ctx });
      setCtx(updated);
    } catch (e: any) { setError(e.message); }
  }, [ctx, setCtx]);

  const handleDownload = useCallback(async (name: string, data: any) => {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      await downloadFile(name, blob);
    } catch (e: any) { setError(e.message); }
  }, []);

  const t06 = ctx.t06Result;

  return (
    <div>
      <h3 style={heading}>TRACE / HANDOFF</h3>

      {/* T06 */}
      <div style={basePanel}>
        <div style={subheading}>T06 — Independent Trace Verifier</div>
        <button style={btn(COLORS.accent, !canRunT06 || loading)} disabled={!canRunT06 || loading} onClick={handleT06}>
          {loading ? '⏳ VERIFYING...' : '▶ RUN T06'}
        </button>

        {t06 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <span style={badge(t06.result === 'PASS' ? COLORS.success : COLORS.fail)}>{t06.result}</span>
              <span style={{ ...mono, color: COLORS.textDim }}>ID: {t06.verifier_id}</span>
              <span style={badge(t06.three_way_match ? COLORS.success : COLORS.fail)}>3-way: {t06.three_way_match ? '✓' : '✗'}</span>
              <span style={{ ...mono, color: COLORS.textDim }}>Anchors: {t06.anchors_checked}</span>
            </div>
            {t06.errors.length > 0 && t06.errors.map((e, i) => (
              <div key={i} style={{ color: COLORS.fail, fontSize: 11, padding: '2px 0' }}>❌ {e}</div>
            ))}
            {t06.verified_walk.length > 0 && (
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                {t06.verified_walk.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: COLORS.textDim, padding: '2px 0', fontFamily: 'monospace' }}>
                    {w.B5_DECISION} → {w.B4_LEDGER} → {w.B3_ATOM || '∅'} → {w.B2_TARGET_TRACE} | src:{w.SIDECAR_SOURCE ? '✓' : '✗'} 3way:{w.THREE_WAY_HASH ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Finalize */}
      {t06Done && !exportReady && (
        <div style={basePanel}>
          <div style={subheading}>Termination & Export</div>
          <button style={btn(COLORS.sealed)} onClick={handleFinalize}>
            🔒 TERMINATE SIDECAR / UNMOUNT VAULT / SEAL B
          </button>
        </div>
      )}

      {/* Export */}
      {exportReady && (
        <div style={basePanel}>
          <div style={subheading}>Export</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btn(COLORS.success)} onClick={() => handleDownload('SEALED_B_ENVELOPE.json', exportBEnvelope(ctx))}>
              📦 SEALED_B_ENVELOPE.json
            </button>
            <button style={btn(COLORS.accent)} onClick={() => handleDownload('GATE_B_RECEIPT.json', exportGateReceipt(ctx))}>
              📋 GATE_B_RECEIPT.json
            </button>
            <button style={btn(COLORS.warn)} onClick={() => handleDownload('B_AUDIT_REPORT.json', buildAuditReport(ctx))}>
              📊 B_AUDIT_REPORT.json
            </button>
          </div>

          {ctx.sidecarAttestation && (
            <div style={{ marginTop: 12, ...mono, fontSize: 11, color: COLORS.textDim }}>
              Sidecar: {ctx.sidecarAttestation.status} | Vault: unmounted | Pipeline: {ctx.stageProgression.EXPORT}
            </div>
          )}
        </div>
      )}

      {error && <div style={{ ...basePanel, borderColor: COLORS.fail }}><span style={{ color: COLORS.fail }}>❌ {error}</span></div>}
    </div>
  );
}
