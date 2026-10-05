import React from 'react';
import type { B2Result } from '../../b/types';
import { basePanel, COLORS, heading, badge, mono } from './styles';

interface Props { result: B2Result | undefined; }

export default function B2TreeView({ result }: Props) {
  if (!result) return <div style={{ color: COLORS.textDim, padding: 16 }}>B2 not yet executed.</div>;

  const nodes = Object.values(result.nodes);
  const hard = nodes.filter(n => n.classification === 'HARD_CORE');
  const org = nodes.filter(n => n.classification === 'ORGANIZATIONAL');

  return (
    <div>
      <h3 style={heading}>B2 — TARGET COMPETENCY TREE</h3>
      <div style={{ ...basePanel, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={badge(COLORS.accent)}>Root: {result.root_role}</span>
        <span style={badge(COLORS.fail)}>HARD_CORE: {hard.length}</span>
        <span style={badge(COLORS.warn)}>ORGANIZATIONAL: {org.length}</span>
        <span style={{ ...mono, color: COLORS.textDim }}>Tree SHA256: {result.frozen_tree_sha256.substring(0, 16)}…</span>
      </div>

      {/* Tree visualization */}
      <div style={basePanel}>
        <div style={{ fontSize: 13, color: COLORS.textBright, marginBottom: 12, fontWeight: 600 }}>
          🌳 {result.root_role}
        </div>
        {[{ title: 'HARD_CORE (★)', items: hard, color: COLORS.fail },
          { title: 'ORGANIZATIONAL (~)', items: org, color: COLORS.warn }
        ].map(group => (
          <div key={group.title} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: group.color, fontWeight: 600, marginBottom: 4 }}>{group.title}</div>
            {group.items.map(node => (
              <div key={node.node_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0 4px 16', borderLeft: `2px solid ${group.color}33` }}>
                <span style={{ ...mono, color: COLORS.accent, minWidth: 40 }}>{node.address}</span>
                <span style={{ ...mono, color: COLORS.textDim, minWidth: 140 }}>{node.node_id}</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>{node.label}</span>
                <span style={badge(node.source_trace.source_match ? COLORS.success : COLORS.warn)}>
                  {node.source_trace.source_match ? 'traced' : 'unmatched'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
