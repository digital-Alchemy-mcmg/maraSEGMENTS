// ============================================================
// B Engine — single engine, adapter-agnostic
// ============================================================

import type { BContext, SealedBEnvelope, GateBReceipt } from './types';
import { runIngressGate } from './authority/ingress-gate';
import { runB1 } from './stages/b1-decouple';
import { runB2 } from './stages/b2-tree';
import { runB3 } from './stages/b3-binding';
import { runB4 } from './stages/b4-audit';
import { runB5 } from './stages/b5-prisms';
import { runT06 } from './verification/t06-trace';
import { terminateSidecar, unmountVault, verifyVaultUnmounted } from './verification/termination';
import { buildSealedBEnvelope, buildGateReceipt } from './contracts';
import { checkC1Readiness } from './verification/c1-readiness';

export async function executeIngress(ctx: BContext): Promise<BContext> {
  ctx.stageProgression.INGRESS = 'RUNNING';
  try {
    const result = await runIngressGate(ctx.envelope, ctx.sidecar, ctx.vault);
    if (!result.passed) {
      ctx.stageProgression.INGRESS = 'FAIL';
      ctx.errors.push(...result.checks.filter(c => !c.passed).map(c => c.message));
      return ctx;
    }
    ctx.identity = result.identity!;
    ctx.stageProgression.INGRESS = 'PASS';
    ctx.stageProgression.B1 = 'READY';
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.INGRESS = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export async function executeB1(ctx: BContext): Promise<BContext> {
  if (ctx.stageProgression.B1 !== 'READY') throw new Error('B1 not ready');
  ctx.stageProgression.B1 = 'RUNNING';
  try {
    ctx.b1Result = await runB1(ctx.envelope, ctx.sidecar);
    ctx.stageProgression.B1 = 'PASS';
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.B1 = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export function sealB1(ctx: BContext): BContext {
  if (ctx.stageProgression.B1 !== 'PASS') throw new Error('B1 not passed');
  ctx.stageProgression.B1 = 'SEALED';
  ctx.stageProgression.B2 = 'READY';
  return ctx;
}

export async function executeB2(ctx: BContext): Promise<BContext> {
  if (ctx.stageProgression.B2 !== 'READY') throw new Error('B2 not ready');
  if (!ctx.b1Result) throw new Error('B1 result missing');
  ctx.stageProgression.B2 = 'RUNNING';
  try {
    ctx.b2Result = await runB2(ctx.envelope, ctx.b1Result);
    ctx.stageProgression.B2 = 'PASS';
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.B2 = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export function freezeB2(ctx: BContext): BContext {
  if (ctx.stageProgression.B2 !== 'PASS') throw new Error('B2 not passed');
  ctx.stageProgression.B2 = 'SEALED';
  ctx.stageProgression.B3 = 'READY';
  return ctx;
}

export function executeB3(ctx: BContext): BContext {
  if (ctx.stageProgression.B3 !== 'READY') throw new Error('B3 not ready');
  if (!ctx.b2Result) throw new Error('B2 result missing');
  ctx.stageProgression.B3 = 'RUNNING';
  try {
    ctx.b3Result = runB3(ctx.b2Result, ctx.vault);
    ctx.stageProgression.B3 = 'PASS';
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.B3 = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export function sealB3(ctx: BContext): BContext {
  if (ctx.stageProgression.B3 !== 'PASS') throw new Error('B3 not passed');
  ctx.stageProgression.B3 = 'SEALED';
  ctx.stageProgression.B4 = 'READY';
  return ctx;
}

export async function executeB4(ctx: BContext): Promise<BContext> {
  if (ctx.stageProgression.B4 !== 'READY') throw new Error('B4 not ready');
  if (!ctx.b2Result || !ctx.b3Result || !ctx.b1Result) throw new Error('Missing prior results');
  ctx.stageProgression.B4 = 'RUNNING';
  try {
    ctx.b4Result = await runB4(
      ctx.b2Result, ctx.b3Result, ctx.vault, ctx.b1Result,
      ctx.identity.candidate_id, ctx.identity.sdna_manifest_sha256
    );
    ctx.stageProgression.B4 = 'PASS';
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.B4 = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export function sealB4(ctx: BContext): BContext {
  if (ctx.stageProgression.B4 !== 'PASS') throw new Error('B4 not passed');
  ctx.stageProgression.B4 = 'SEALED';
  ctx.stageProgression.B5 = 'READY';
  return ctx;
}

export function executeB5(ctx: BContext): BContext {
  if (ctx.stageProgression.B5 !== 'READY') throw new Error('B5 not ready');
  if (!ctx.b2Result || !ctx.b4Result) throw new Error('Missing prior results');
  ctx.stageProgression.B5 = 'RUNNING';
  try {
    ctx.b5Result = runB5(ctx.b2Result, ctx.b4Result);
    ctx.stageProgression.B5 = 'PASS';
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.B5 = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export function sealB5(ctx: BContext): BContext {
  if (ctx.stageProgression.B5 !== 'PASS') throw new Error('B5 not passed');
  ctx.stageProgression.B5 = 'SEALED';
  ctx.stageProgression.T06 = 'READY';
  return ctx;
}

export async function executeT06(ctx: BContext): Promise<BContext> {
  if (ctx.stageProgression.T06 !== 'READY') throw new Error('T06 not ready');
  if (!ctx.b1Result || !ctx.b2Result || !ctx.b4Result || !ctx.b5Result) throw new Error('Missing prior results');
  ctx.stageProgression.T06 = 'RUNNING';
  try {
    ctx.t06Result = await runT06(
      ctx.b1Result, ctx.b2Result, ctx.b4Result, ctx.b5Result,
      ctx.sidecar, ctx.envelope.A_scout.original_content_sha256
    );
    if (ctx.t06Result.result === 'PASS') {
      ctx.stageProgression.T06 = 'PASS';
    } else {
      ctx.stageProgression.T06 = 'FAIL';
      ctx.errors.push(...ctx.t06Result.errors);
    }
    return ctx;
  } catch (e: any) {
    ctx.stageProgression.T06 = 'FAIL';
    ctx.errors.push(e.message);
    return ctx;
  }
}

export function finalizeB(ctx: BContext): BContext {
  if (ctx.stageProgression.T06 !== 'PASS') throw new Error('T06 not passed');
  // 1. Verify tag layer was purged (B4 does this)
  if (!ctx.b4Result?.tag_layer_purged) throw new Error('Tag layer not purged');
  // 2. Terminate sidecar
  ctx.sidecarAttestation = terminateSidecar(ctx);
  // 3. Unmount vault
  unmountVault(ctx);
  // 4. Verify vault unmounted
  if (!verifyVaultUnmounted(ctx)) throw new Error('Vault still accessible after unmount');
  // 5. Build sealed envelope (runs C1 readiness)
  const sealed = buildSealedBEnvelope(ctx);
  ctx.stageProgression.EXPORT = 'PASS';
  return ctx;
}

export function exportBEnvelope(ctx: BContext): SealedBEnvelope {
  if (ctx.stageProgression.EXPORT !== 'PASS') throw new Error('Export not ready');
  return buildSealedBEnvelope(ctx);
}

export function exportGateReceipt(ctx: BContext): GateBReceipt {
  return buildGateReceipt(ctx);
}

// Convenience: run complete B cycle using the same individual stage functions
export async function runCompleteB(ctx: BContext): Promise<BContext> {
  ctx = await executeIngress(ctx);
  if (ctx.stageProgression.INGRESS !== 'PASS') return ctx;

  ctx = await executeB1(ctx);
  if (ctx.stageProgression.B1 !== 'PASS') return ctx;
  ctx = sealB1(ctx);

  ctx = await executeB2(ctx);
  if (ctx.stageProgression.B2 !== 'PASS') return ctx;
  ctx = freezeB2(ctx);

  ctx = executeB3(ctx);
  if (ctx.stageProgression.B3 !== 'PASS') return ctx;
  ctx = sealB3(ctx);

  ctx = await executeB4(ctx);
  if (ctx.stageProgression.B4 !== 'PASS') return ctx;
  ctx = sealB4(ctx);

  ctx = executeB5(ctx);
  if (ctx.stageProgression.B5 !== 'PASS') return ctx;
  ctx = sealB5(ctx);

  ctx = await executeT06(ctx);
  if (ctx.stageProgression.T06 !== 'PASS') return ctx;

  ctx = finalizeB(ctx);
  return ctx;
}
