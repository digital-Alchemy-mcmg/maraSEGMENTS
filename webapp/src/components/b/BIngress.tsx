import React, { useState, useCallback } from 'react';
import type { BContext, StageProgression, StageName } from '../../b/types';
import { createStandaloneBContext } from '../../b/adapters/standalone-adapter';
import { runIngressGate } from '../../b/authority/ingress-gate';
import { basePanel, btn, COLORS, heading, badge, STATUS_COLORS } from './styles';

interface Props {
  onContextCreated: (ctx: BContext, ingressChecks: any[]) => void;
}

export default function BIngress({ onContextCreated }: Props) {
  const [envelopeText, setEnvelopeText] = useState('');
  const [sidecarText, setSidecarText] = useState('');
  const [candidateYaml, setCandidateYaml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<any[]>([]);

  const handleFile = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsText(file);
  };

  const runIngress = useCallback(async () => {
    setError(null);
    setLoading(true);
    setChecks([]);
    try {
      if (!envelopeText.trim()) throw new Error('Missing SEALED_A_ENVELOPE.json');
      if (!sidecarText.trim()) throw new Error('Missing STAGE_A_SIDECAR.json');
      if (!candidateYaml.trim()) throw new Error('Missing candidate.sdna.yaml');

      const ctx = await createStandaloneBContext(envelopeText, sidecarText, candidateYaml);
      const result = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
      setChecks(result.checks);

      if (!result.passed) {
        ctx.stageProgression.INGRESS = 'FAIL';
        ctx.errors = result.checks.filter(c => !c.passed).map(c => c.message);
        throw new Error('Ingress gate FAILED: ' + ctx.errors.join('; '));
      }

      ctx.identity = result.identity!;
      ctx.stageProgression.INGRESS = 'PASS';
      ctx.stageProgression.B1 = 'READY';
      onContextCreated(ctx, result.checks);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [envelopeText, sidecarText, candidateYaml, onContextCreated]);

  return (
    <div>
      <h3 style={heading}>INGRESS — Load & Verify Inputs</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'SEALED_A_ENVELOPE.json', value: envelopeText, setter: setEnvelopeText, accept: '.json' },
          { label: 'STAGE_A_SIDECAR.json', value: sidecarText, setter: setSidecarText, accept: '.json' },
          { label: 'candidate.sdna.yaml', value: candidateYaml, setter: setCandidateYaml, accept: '.yaml,.yml' },
        ].map(({ label, value, setter, accept }) => (
          <div key={label} style={basePanel}>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>{label}</div>
            <input type="file" accept={accept} onChange={handleFile(setter)}
              style={{ fontSize: 11, color: COLORS.text, marginBottom: 8, display: 'block' }} />
            <textarea
              value={value}
              onChange={e => setter(e.target.value)}
              placeholder={`Paste ${label} content...`}
              style={{ width: '100%', height: 120, background: COLORS.code, color: COLORS.text,
                border: `1px solid ${COLORS.panelBorder}`, borderRadius: 4, padding: 8,
                fontFamily: 'monospace', fontSize: 11, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: value ? COLORS.success : COLORS.textDim, marginTop: 4 }}>
              {value ? `✓ ${value.length} chars` : '○ empty'}
            </div>
          </div>
        ))}
      </div>

      <button style={btn(COLORS.accent, loading || !envelopeText || !sidecarText || !candidateYaml)}
        onClick={runIngress}
        disabled={loading || !envelopeText || !sidecarText || !candidateYaml}>
        {loading ? '⏳ VERIFYING...' : '▶ VERIFY INGRESS'}
      </button>

      {checks.length > 0 && (
        <div style={{ ...basePanel, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textBright, marginBottom: 8 }}>Continuity Checks</div>
          {checks.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
              <span style={badge(c.passed ? COLORS.success : COLORS.fail)}>{c.passed ? 'PASS' : 'FAIL'}</span>
              <span style={{ color: COLORS.text, fontFamily: 'monospace', fontSize: 11 }}>{c.name}</span>
              <span style={{ color: COLORS.textDim, fontSize: 11 }}>{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ ...basePanel, borderColor: COLORS.fail, marginTop: 12 }}>
          <div style={{ color: COLORS.fail, fontSize: 13, fontWeight: 600 }}>❌ {error}</div>
        </div>
      )}
    </div>
  );
}
