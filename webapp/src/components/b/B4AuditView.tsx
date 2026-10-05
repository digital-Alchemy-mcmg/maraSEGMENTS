import React from 'react';
import type { B4Result } from '../../b/types';
import { basePanel, COLORS, heading, badge, mono } from './styles';

interface Props { result: B4Result | undefined; }

const DISP_COLOR: Record<string, string> = { PASS: COLORS.success, UNRESOLVED: COLORS.warn, REJECTED_INTEGRITY: COLORS.fail };

export default function B4AuditView({ result }: Props) {
  if (!result) return <div style={{ color: COLORS.textDim, padding: 16 }}>B4 not yet executed.</div>;

  return (
    <div>
      <h3 style={heading}>B4 — TRUTH AUDIT LEDGER</h3>
      <div style={{ ...basePanel, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={badge(COLORS.success)}>PASS: {result.receipt.pass_count}</span>
        <span style={badge(COLORS.warn)}>UNRESOLVED: {result.receipt.unresolved_count}</span>
        <span style={badge(COLORS.fail)}>REJECTED: {result.receipt.rejected_count}</span>
        <span style={badge(COLORS.accent)}>MATCH: {result.receipt.match_percentage}%</span>
        <span style={{ ...mono, color: COLORS.textDim }}>Ledger: {result.ledger_sha256.substring(0, 12)}…</span>
        <span style={badge(result.tag_layer_purged ? COLORS.success : COLORS.fail)}>
          Tags: {result.tag_layer_purged ? 'PURGED' : 'ACTIVE'}
        </span>
      </div>

      <div style={{ ...basePanel }}>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 6 }}>
          Candidate: <span style={{ color: COLORS.text }}>{result.candidate_identity.candidate_id}</span> |
          SDNA: <span style={{ ...mono, color: COLORS.text }}>{result.candidate_identity.sdna_manifest_sha256.substring(0, 12)}…</span>
        </div>
      </div>

      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {result.ledger.map((r, i) => (
          <div key={i} style={{ ...basePanel, borderLeft: `3px solid ${DISP_COLOR[r.disposition] || COLORS.textDim}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ ...mono, color: COLORS.accent }}>{r.node_id}</span>
              <div>
                <span style={badge(DISP_COLOR[r.disposition])}>{r.disposition}</span>
                <span style={badge(r.evidence_ceiling === 'SUPPORTED_FACTUAL' ? COLORS.success : COLORS.textDim)}>
                  {r.evidence_ceiling}
                </span>
              </div>
            </div>
            <div style={{ color: COLORS.text, fontSize: 12, marginBottom: 4 }}>{r.proposition}</div>
            {r.atom_id && (
              <div style={{ fontSize: 11, color: COLORS.textDim }}>
                Atom: {r.atom_id} | Domain: {r.domain} | Score: {r.binding_score} |
                Integrity: {r.candidate_atom_integrity_verified ? '✓' : '✗'}
              </div>
            )}
            {r.target_trace.tag_id && (
              <div style={{ fontSize: 11, color: COLORS.textDim }}>
                Trace: {r.target_trace.tag_id} | Match: {r.target_trace.source_match ? '✓' : '✗'} |
                Span: [{r.target_trace.span_start}:{r.target_trace.span_end}]
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
