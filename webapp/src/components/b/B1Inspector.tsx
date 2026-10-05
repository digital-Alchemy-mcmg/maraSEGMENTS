import React from 'react';
import type { B1Result } from '../../b/types';
import { basePanel, COLORS, heading, badge, mono } from './styles';

interface Props { result: B1Result | undefined; }

export default function B1Inspector({ result }: Props) {
  if (!result) return <div style={{ color: COLORS.textDim, padding: 16 }}>B1 not yet executed.</div>;

  return (
    <div>
      <h3 style={heading}>B1 — DECOUPLE: Requirement Source Traces</h3>
      <div style={{ ...basePanel, display: 'flex', gap: 16 }}>
        <span style={badge(COLORS.success)}>Matched: {result.receipt.matched_count}</span>
        <span style={badge(COLORS.fail)}>Unmatched: {result.receipt.unmatched_count}</span>
        <span style={badge(COLORS.accent)}>Total: {result.receipt.tag_count}</span>
        <span style={{ ...mono, color: COLORS.textDim }}>SHA256: {result.receipt.target_source_sha256.substring(0, 16)}…</span>
      </div>
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {result.tags.map(tag => (
          <div key={tag.tag_id} style={{ ...basePanel, borderLeft: `3px solid ${tag.source_match ? COLORS.success : COLORS.warn}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...mono, color: COLORS.accent }}>{tag.tag_id}</span>
              <span style={badge(tag.classification === 'HARD_REQUIREMENT' ? COLORS.fail : COLORS.warn)}>
                {tag.classification}
              </span>
            </div>
            <div style={{ color: COLORS.textBright, fontSize: 13, marginBottom: 4 }}>{tag.requirement_label}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: COLORS.textDim }}>
              <span>Match: {tag.source_match ? '✓' : '✗'}</span>
              <span>Span: [{tag.span_start}:{tag.span_end}]</span>
            </div>
            {tag.source_excerpt && (
              <div style={{ ...mono, background: COLORS.code, padding: 8, borderRadius: 4, marginTop: 6, color: COLORS.text, whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>
                {tag.source_excerpt}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
