import React from 'react';
import type { B5Result } from '../../b/types';
import { basePanel, COLORS, heading, badge, mono, subheading } from './styles';

interface Props { result: B5Result | undefined; }

const PROM_COLOR: Record<string, string> = {
  FOREGROUND: COLORS.success, REINFORCEMENT: COLORS.accent,
  BACKGROUND: COLORS.textDim, SUPPRESSED: COLORS.fail,
};

const PRISM_LABELS: Record<string, string> = {
  INDEPENDENT_STAFFING_FIRM_OWNER: '🏢 Staffing Owner',
  SPORTS_AGENT: '🏆 Sports Agent',
  DISCOVERY_SCOUT: '🔍 Discovery Scout',
  SALES_HEADHUNTER: '💼 Headhunter',
  CASTING_DIRECTOR: '🎬 Casting Director',
};

export default function B5ProjectionView({ result }: Props) {
  if (!result) return <div style={{ color: COLORS.textDim, padding: 16 }}>B5 not yet executed.</div>;

  return (
    <div>
      <h3 style={heading}>B5 — FIVE-PRISM SEMANTIC PROJECTION</h3>

      {/* Prism Scores */}
      <div style={basePanel}>
        <div style={subheading}>Five Prisms</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {result.ranked_prisms.map(ps => (
            <div key={ps.prism} style={{
              background: ps.prism === result.owner_prism ? COLORS.accent + '22' : COLORS.code,
              border: `1px solid ${ps.prism === result.owner_prism ? COLORS.accent : COLORS.panelBorder}`,
              borderRadius: 6, padding: 10, textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{PRISM_LABELS[ps.prism]?.charAt(0) || '?'}</div>
              <div style={{ fontSize: 11, color: COLORS.textBright, marginBottom: 2 }}>{PRISM_LABELS[ps.prism] || ps.prism}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textBright }}>{(ps.score * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 10, color: COLORS.textDim }}>{ps.reasoning}</div>
              {ps.prism === result.owner_prism && <span style={badge(COLORS.accent)}>OWNER</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ ...basePanel, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={badge(COLORS.accent)}>Posture: {result.projection_posture}</span>
        <span style={badge(COLORS.success)}>FG: {result.prominence_classes.FOREGROUND}</span>
        <span style={badge(COLORS.accent)}>RF: {result.prominence_classes.REINFORCEMENT}</span>
        <span style={badge(COLORS.textDim)}>BG: {result.prominence_classes.BACKGROUND}</span>
        <span style={badge(COLORS.fail)}>SUP: {result.prominence_classes.SUPPRESSED}</span>
      </div>

      {/* Semantic Priorities */}
      {result.semantic_priorities.length > 0 && (
        <div style={basePanel}>
          <div style={subheading}>Semantic Priorities</div>
          {result.semantic_priorities.map((p, i) => (
            <div key={i} style={{ color: COLORS.text, fontSize: 12, padding: '2px 0' }}>▸ {p}</div>
          ))}
        </div>
      )}

      {/* Propositions */}
      <div style={basePanel}>
        <div style={subheading}>Verified Propositions ({result.verified_candidate_propositions.length})</div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {result.verified_candidate_propositions.map(p => (
            <div key={p.proposition_id} style={{ borderLeft: `3px solid ${PROM_COLOR[p.prominence_class]}`, padding: '6px 0 6px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                <span style={{ ...mono, color: COLORS.accent }}>{p.proposition_id}</span>
                <span style={badge(PROM_COLOR[p.prominence_class])}>{p.prominence_class}</span>
                <span style={badge(COLORS.textDim)}>{p.target_weight}</span>
              </div>
              <div style={{ color: COLORS.text, fontSize: 12 }}>{p.statement}</div>
              <div style={{ fontSize: 10, color: COLORS.textDim }}>
                B2→{p.lineage.B2_node} B3→{p.lineage.B3_atom || '∅'} B4→{p.lineage.B4_disposition} B5→{p.lineage.B5_prominence}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Writing Boundaries */}
      <div style={basePanel}>
        <div style={subheading}>Writing Boundaries</div>
        <div style={{ color: COLORS.warn, fontSize: 12, marginBottom: 4 }}>
          Ceiling: {result.writing_boundaries.assertiveness_ceiling}
        </div>
        {result.writing_boundaries.prohibited_implications.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: COLORS.fail, fontWeight: 600 }}>PROHIBITED:</div>
            {result.writing_boundaries.prohibited_implications.map((p, i) => (
              <div key={i} style={{ color: COLORS.textDim, fontSize: 11, padding: '1px 0' }}>🚫 {p}</div>
            ))}
          </div>
        )}
      </div>

      {/* Gaps */}
      {result.unresolved_gaps.length > 0 && (
        <div style={basePanel}>
          <div style={subheading}>Unresolved Gaps</div>
          {result.unresolved_gaps.map(g => (
            <div key={g.node_id} style={{ color: COLORS.warn, fontSize: 12, padding: '2px 0' }}>
              ⚠ {g.node_id}: {g.target_requirement} — {g.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
