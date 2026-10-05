// ============================================================
// Contracts — C handoff, gate receipt, audit report
// ============================================================

import type { BContext, SealedBEnvelope, GateBReceipt, StageName, BLayer } from './types';
import { appendBLayer } from './authority/envelope';
import { checkC1Readiness } from './verification/c1-readiness';

export function buildBLayer(ctx: BContext): BLayer {
  if (!ctx.b2Result) throw new Error('B2 not complete');
  if (!ctx.b4Result) throw new Error('B4 not complete');
  if (!ctx.b5Result) throw new Error('B5 not complete');
  if (!ctx.sidecarAttestation) throw new Error('Sidecar not terminated');

  return {
    competency_tree: ctx.b2Result,
    b4_ledger: ctx.b4Result,
    b5_projection: ctx.b5Result,
    B_sidecar_attestation: ctx.sidecarAttestation,
  };
}

export function buildSealedBEnvelope(ctx: BContext): SealedBEnvelope {
  const bLayer = buildBLayer(ctx);
  const sealed = appendBLayer(ctx.envelope, bLayer);
  const c1 = checkC1Readiness(sealed);
  if (!c1.ready) {
    const failing = c1.checks.filter(c => !c.valid).map(c => c.field);
    throw new Error(`C1 readiness failed: ${failing.join(', ')}`);
  }
  return sealed;
}

export function buildGateReceipt(ctx: BContext): GateBReceipt {
  const completed: StageName[] = [];
  for (const [k, v] of Object.entries(ctx.stageProgression)) {
    if (v === 'SEALED' || v === 'PASS') completed.push(k as StageName);
  }
  return {
    run_id: ctx.identity.run_id,
    candidate_id: ctx.identity.candidate_id,
    target_id: ctx.identity.target_id,
    pipeline_version: ctx.identity.pipeline_version,
    ingress_passed: ctx.stageProgression.INGRESS === 'PASS' || ctx.stageProgression.INGRESS === 'SEALED',
    stages_completed: completed,
    t06_result: ctx.t06Result?.result || 'FAIL',
    c1_ready: ctx.stageProgression.EXPORT === 'PASS' || ctx.stageProgression.EXPORT === 'SEALED',
    timestamp: new Date().toISOString(),
    identity: ctx.identity,
  };
}

export function buildAuditReport(ctx: BContext): Record<string, any> {
  return {
    report_type: 'B_AUDIT_REPORT',
    generated: new Date().toISOString(),
    identity: ctx.identity,
    stage_progression: ctx.stageProgression,
    b1_summary: ctx.b1Result ? {
      tag_count: ctx.b1Result.receipt.tag_count,
      matched: ctx.b1Result.receipt.matched_count,
      unmatched: ctx.b1Result.receipt.unmatched_count,
    } : null,
    b2_summary: ctx.b2Result ? {
      node_count: ctx.b2Result.receipt.node_count,
      frozen_tree_sha256: ctx.b2Result.frozen_tree_sha256,
    } : null,
    b3_summary: ctx.b3Result ? {
      bound: ctx.b3Result.receipt.bound_count,
      unbound: ctx.b3Result.receipt.unbound_count,
    } : null,
    b4_summary: ctx.b4Result ? {
      pass: ctx.b4Result.receipt.pass_count,
      unresolved: ctx.b4Result.receipt.unresolved_count,
      rejected: ctx.b4Result.receipt.rejected_count,
      match_pct: ctx.b4Result.receipt.match_percentage,
      ledger_sha256: ctx.b4Result.ledger_sha256,
    } : null,
    b5_summary: ctx.b5Result ? {
      propositions: ctx.b5Result.receipt.proposition_count,
      owner_prism: ctx.b5Result.owner_prism,
      posture: ctx.b5Result.projection_posture,
      gaps: ctx.b5Result.unresolved_gaps.length,
    } : null,
    t06_result: ctx.t06Result?.result || 'NOT_RUN',
    sidecar_attestation: ctx.sidecarAttestation?.status || 'NOT_TERMINATED',
    NOTE: 'This is a human-readable audit report. NOT a pipeline authority.',
  };
}
