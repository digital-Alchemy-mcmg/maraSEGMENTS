import React, { useState, useCallback } from 'react';
import type { TestResult } from '../../b/types';
import { prepareFixtures } from '../../b/test-fixtures';
import { createStandaloneBContext } from '../../b/adapters/standalone-adapter';
import { runIngressGate } from '../../b/authority/ingress-gate';
import { mountCandidateVault, sha256, parseSDNAYaml, canonicalizeSDNA } from '../../b/authority/canonical-sdna';
import { hydrateEnvelope } from '../../b/authority/envelope';
import { hydrateSidecar } from '../../b/authority/sidecar';
import { checkAccess, AccessViolationError } from '../../b/authority/access-control';
import { runCompleteB } from '../../b/engine';
import { checkC1Readiness } from '../../b/verification/c1-readiness';
import { basePanel, btn, COLORS, heading, badge } from './styles';

export default function BTestHarness() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (name: string, category: string, passed: boolean, message: string, dur: number) => {
    setResults(prev => [...prev, { name, category, passed, message, duration_ms: dur }]);
  };

  const t = async (name: string, cat: string, fn: () => Promise<void>) => {
    const start = performance.now();
    try {
      await fn();
      addResult(name, cat, true, 'OK', performance.now() - start);
    } catch (e: any) {
      addResult(name, cat, false, e.message, performance.now() - start);
    }
  };

  const tExpectFail = async (name: string, cat: string, fn: () => Promise<void>) => {
    const start = performance.now();
    try {
      await fn();
      addResult(name, cat, false, 'Expected failure but succeeded', performance.now() - start);
    } catch (e: any) {
      addResult(name, cat, true, `Correctly failed: ${e.message.substring(0, 60)}`, performance.now() - start);
    }
  };

  const runAll = useCallback(async () => {
    setResults([]);
    setRunning(true);

    const fx = await prepareFixtures();

    // === INGRESS FAILURES ===
    await tExpectFail('Missing envelope', 'INGRESS', async () => {
      await createStandaloneBContext('', JSON.stringify(fx.sidecar), fx.candidateYaml);
    });
    await tExpectFail('Missing sidecar', 'INGRESS', async () => {
      await createStandaloneBContext(JSON.stringify(fx.envelope), '', fx.candidateYaml);
    });
    await tExpectFail('Missing candidate YAML', 'INGRESS', async () => {
      await createStandaloneBContext(JSON.stringify(fx.envelope), JSON.stringify(fx.sidecar), '');
    });
    await tExpectFail('Invalid YAML', 'INGRESS', async () => {
      await mountCandidateVault('!!binary not_valid_sdna');
    });
    await tExpectFail('Missing SDNA candidate_id', 'INGRESS', async () => {
      await mountCandidateVault('atoms:\n  - atom_id: x\n    content: y\n    domain: z');
    });
    await tExpectFail('run_id mismatch', 'INGRESS', async () => {
      const bad = { ...fx.envelope, Z_state: { ...fx.envelope.Z_state, run_id: 'wrong-run' } };
      const ctx = await createStandaloneBContext(JSON.stringify(bad), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const r = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
      if (!r.passed) throw new Error('run_id mismatch detected');
    });
    await tExpectFail('target_id mismatch', 'INGRESS', async () => {
      const bad = { ...fx.envelope, Z_state: { ...fx.envelope.Z_state, target_id: 'wrong-target' } };
      const ctx = await createStandaloneBContext(JSON.stringify(bad), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const r = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
      if (!r.passed) throw new Error('target_id mismatch detected');
    });
    await tExpectFail('candidate_id mismatch', 'INGRESS', async () => {
      const bad = { ...fx.envelope, Z_state: { ...fx.envelope.Z_state, candidate_id: 'wrong-candidate' } };
      const ctx = await createStandaloneBContext(JSON.stringify(bad), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const r = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
      if (!r.passed) throw new Error('candidate_id mismatch detected');
    });
    await tExpectFail('SDNA hash mismatch', 'INGRESS', async () => {
      const bad = { ...fx.envelope, Z_state: { ...fx.envelope.Z_state, sdna_manifest_sha256: 'badhash' } };
      const ctx = await createStandaloneBContext(JSON.stringify(bad), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const r = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
      if (!r.passed) throw new Error('SDNA hash mismatch detected');
    });
    await tExpectFail('Source hash mismatch', 'INGRESS', async () => {
      const bad = { ...fx.sidecar, original_content_sha256: 'badhash' };
      const ctx = await createStandaloneBContext(JSON.stringify(fx.envelope), JSON.stringify(bad), fx.candidateYaml);
      const r = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
      if (!r.passed) throw new Error('source hash mismatch detected');
    });

    // === Z_STATE PATH REGRESSION ===
    await t('Z_state identity resolution', 'REGRESSION', async () => {
      const envelope = {
        Z_state: {
          run_id: 'run-amzq-b-001',
          candidate_id: 'cand-amzq-b-001',
          target_id: 'target-amzq-b-001',
          pipeline_version: '2.0.0',
          current_stage: 'A_COMPLETE',
          status: 'complete:HANDOFF_TO_B',
        },
        A_scout: fx.envelope.A_scout,
        history: [],
      };
      const sidecar = {
        run_binding: { run_id: 'run-amzq-b-001', target_id: 'target-amzq-b-001' },
        raw_posting: fx.sidecar.raw_posting,
        original_content_sha256: fx.sidecar.original_content_sha256,
      };
      const yamlWithId = fx.candidateYaml.replace('candidate-alpha', 'cand-amzq-b-001');
      const ctx = await createStandaloneBContext(JSON.stringify(envelope), JSON.stringify(sidecar), yamlWithId);
      if (ctx.identity.run_id !== 'run-amzq-b-001') throw new Error('run_id not resolved from Z_state');
      if (ctx.identity.candidate_id !== 'cand-amzq-b-001') throw new Error('candidate_id not resolved from Z_state');
      if (ctx.identity.target_id !== 'target-amzq-b-001') throw new Error('target_id not resolved from Z_state');
      if (ctx.identity.pipeline_version !== '2.0.0') throw new Error('pipeline_version not resolved from Z_state');
    });
    await tExpectFail('Missing Z_state.run_id fails closed', 'REGRESSION', async () => {
      const envelope = {
        Z_state: {
          candidate_id: 'cand-amzq-b-001',
          target_id: 'target-amzq-b-001',
          pipeline_version: '2.0.0',
          current_stage: 'A_COMPLETE',
          status: 'complete:HANDOFF_TO_B',
        },
        A_scout: fx.envelope.A_scout,
      };
      await createStandaloneBContext(JSON.stringify(envelope), JSON.stringify(fx.sidecar), fx.candidateYaml);
    });

    // === A_SCOUT TAXONOMY REGRESSION ===
    await t('Canonical taxonomy object resolves', 'REGRESSION', async () => {
      const envelope = {
        Z_state: fx.envelope.Z_state,
        A_scout: {
          target_entity: { company_name: 'Northstar Systems', job_title: 'Senior Software Engineer' },
          requirements_taxonomy: {
            hard_requirements: ['example hard requirement'],
            soft_requirements: [],
            keyword_lexicon: [],
          },
          original_content_sha256: fx.envelope.A_scout.original_content_sha256,
        },
      };
      const ctx = await createStandaloneBContext(JSON.stringify(envelope), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const tax = ctx.envelope.A_scout.requirements_taxonomy;
      if (!Array.isArray(tax)) throw new Error('taxonomy not normalized to array');
      if (tax.length !== 1) throw new Error('Expected 1 normalized requirement, got ' + tax.length);
      if (tax[0].classification !== 'HARD_REQUIREMENT') throw new Error('Expected HARD_REQUIREMENT');
      if (tax[0].label !== 'example hard requirement') throw new Error('Label mismatch');
    });
    await tExpectFail('Missing requirements_taxonomy fails closed', 'REGRESSION', async () => {
      const envelope = {
        Z_state: fx.envelope.Z_state,
        A_scout: {
          target_entity: { company_name: 'X' },
          original_content_sha256: fx.envelope.A_scout.original_content_sha256,
        },
      };
      await createStandaloneBContext(JSON.stringify(envelope), JSON.stringify(fx.sidecar), fx.candidateYaml);
    });

    // === ACCESS FAILURES ===
    await tExpectFail('B1 candidate atom read', 'ACCESS', async () => {
      checkAccess('B1', 'CANDIDATE_SDNA_ATOMS', 'READ');
    });
    await tExpectFail('B2 candidate atom read', 'ACCESS', async () => {
      checkAccess('B2', 'CANDIDATE_SDNA_ATOMS', 'READ');
    });
    await tExpectFail('B3 sidecar raw read', 'ACCESS', async () => {
      checkAccess('B3', 'RAW_TARGET_TEXT', 'READ');
    });
    await tExpectFail('B3 raw HTML read', 'ACCESS', async () => {
      checkAccess('B3', 'RAW_HTML', 'READ');
    });
    await tExpectFail('B5 sidecar read', 'ACCESS', async () => {
      checkAccess('B5', 'RAW_TARGET_TEXT', 'READ');
    });
    await tExpectFail('B5 SDNA read', 'ACCESS', async () => {
      checkAccess('B5', 'CANDIDATE_SDNA_ATOMS', 'READ');
    });
    await tExpectFail('C sidecar request', 'ACCESS', async () => {
      checkAccess('C', 'RAW_TARGET_TEXT', 'READ');
    });
    await tExpectFail('C SDNA request', 'ACCESS', async () => {
      checkAccess('C', 'CANDIDATE_SDNA_ATOMS', 'READ');
    });

    // === FULL B CYCLE ===
    await t('Full B lifecycle', 'LIFECYCLE', async () => {
      const ctx = await createStandaloneBContext(JSON.stringify(fx.envelope), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const result = await runCompleteB(ctx);
      if (result.stageProgression.EXPORT !== 'PASS') throw new Error('Full cycle did not complete: ' + JSON.stringify(result.stageProgression));
    });

    // === SDNA CANONICALIZATION ===
    await t('SDNA canonical hash determinism', 'INTEGRITY', async () => {
      const sdna1 = parseSDNAYaml(fx.candidateYaml);
      const h1 = await canonicalizeSDNA(sdna1);
      const sdna2 = parseSDNAYaml(fx.candidateYaml);
      const h2 = await canonicalizeSDNA(sdna2);
      if (h1 !== h2) throw new Error('Non-deterministic SDNA hash');
    });

    // === POST-UNMOUNT ===
    await t('Post-unmount vault inaccessible', 'HANDOFF', async () => {
      const ctx = await createStandaloneBContext(JSON.stringify(fx.envelope), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const result = await runCompleteB(ctx);
      if (result.vault.mounted) throw new Error('Vault still mounted');
      if (result.vault.atoms.length > 0) throw new Error('Vault atoms still accessible');
      if (result.vault.atom_index.size > 0) throw new Error('Vault index still accessible');
    });

    // === C1 READINESS ===
    await t('C1 readiness pass', 'HANDOFF', async () => {
      const ctx = await createStandaloneBContext(JSON.stringify(fx.envelope), JSON.stringify(fx.sidecar), fx.candidateYaml);
      const result = await runCompleteB(ctx);
      const { buildSealedBEnvelope } = await import('../../b/contracts');
      const sealed = buildSealedBEnvelope(result);
      const c1 = checkC1Readiness(sealed);
      if (!c1.ready) throw new Error('C1 not ready: ' + c1.checks.filter(c => !c.valid).map(c => c.field).join(', '));
    });

    setRunning(false);
  }, []);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const categories = [...new Set(results.map(r => r.category))];

  return (
    <div>
      <h3 style={heading}>TEST HARNESS</h3>
      <div style={{ marginBottom: 12 }}>
        <button style={btn(COLORS.accent, running)} disabled={running} onClick={runAll}>
          {running ? '⏳ RUNNING TESTS...' : '▶ RUN ALL TESTS'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ ...basePanel, display: 'flex', gap: 16 }}>
          <span style={badge(COLORS.success)}>PASS: {passed}</span>
          <span style={badge(COLORS.fail)}>FAIL: {failed}</span>
          <span style={badge(COLORS.accent)}>TOTAL: {results.length}</span>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 8 }}>
          <div style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 600, padding: '4px 0', textTransform: 'uppercase' }}>{cat}</div>
          {results.filter(r => r.category === cat).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
              <span style={badge(r.passed ? COLORS.success : COLORS.fail)}>{r.passed ? 'PASS' : 'FAIL'}</span>
              <span style={{ color: COLORS.text, minWidth: 200 }}>{r.name}</span>
              <span style={{ color: COLORS.textDim, fontSize: 11, flex: 1 }}>{r.message}</span>
              <span style={{ color: COLORS.textDim, fontSize: 10 }}>{r.duration_ms.toFixed(1)}ms</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
