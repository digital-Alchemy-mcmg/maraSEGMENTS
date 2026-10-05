import React from 'react';
import type { B3Result } from '../../b/types';
import { basePanel, COLORS, heading, badge, mono } from './styles';

interface Props { result: B3Result | undefined; }

export default function B3BindingView({ result }: Props) {
  if (!result) return <div style={{ color: COLORS.textDim, padding: 16 }}>B3 not yet executed.</div>;

  return (
    <div>
      <h3 style={heading}>B3 — EVIDENCE BINDING</h3>
      <div style={{ ...basePanel, display: 'flex', gap: 16 }}>
        <span style={badge(COLORS.success)}>BOUND: {result.receipt.bound_count}</span>
        <span style={badge(COLORS.warn)}>UNBOUND: {result.receipt.unbound_count}</span>
        <span style={badge(COLORS.accent)}>Total: {result.receipt.total_bindings}</span>
      </div>
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {result.bindings.map(b => (
          <div key={b.node_id} style={{ ...basePanel, borderLeft: `3px solid ${b.status === 'BOUND' ? COLORS.success : COLORS.warn}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ ...mono, color: COLORS.accent }}>{b.node_id}</span>
              <span style={badge(b.status === 'BOUND' ? COLORS.success : COLORS.warn)}>{b.status}</span>
            </div>
            {b.status === 'BOUND' && (
              <>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 2 }}>
                  Atom: <span style={{ color: COLORS.text }}>{b.bound_atom_id}</span> | Domain: <span style={{ color: COLORS.text }}>{b.domain}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={badge(COLORS.accent)}>Score: {b.binding_score}</span>
                  {b.binding_basis.map(bb => <span key={bb} style={badge(COLORS.sealed)}>{bb}</span>)}
                </div>
                <div style={{ ...mono, background: COLORS.code, padding: 6, borderRadius: 4, color: COLORS.text, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto', fontSize: 11 }}>
                  {b.atom_content?.substring(0, 200)}{(b.atom_content?.length || 0) > 200 ? '…' : ''}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
