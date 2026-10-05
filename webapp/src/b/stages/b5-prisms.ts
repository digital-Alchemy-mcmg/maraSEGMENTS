// ============================================================
// B5 — FIVE-PRISM SEMANTIC PROJECTION
// ============================================================

import type {
  B2Result, B4Result, B5Result, VerifiedProposition, UnresolvedGap,
  PrismName, PrismScore, ProminenceClass, WritingBoundaries, AuditRecord
} from '../types';
import { checkAccess } from '../authority/access-control';

const PRISM_NAMES: PrismName[] = [
  'INDEPENDENT_STAFFING_FIRM_OWNER', 'SPORTS_AGENT',
  'DISCOVERY_SCOUT', 'SALES_HEADHUNTER', 'CASTING_DIRECTOR',
];

function scorePrism(prism: PrismName, passRecords: AuditRecord[], allRecords: AuditRecord[], b2: B2Result): PrismScore {
  const totalNodes = Object.keys(b2.nodes).length;
  const passCount = passRecords.length;
  const domains = new Set(passRecords.map(r => r.domain).filter(Boolean));
  const hardNodes = Object.values(b2.nodes).filter(n => n.classification === 'HARD_CORE');
  const hardPass = passRecords.filter(r => hardNodes.some(n => n.node_id === r.node_id));
  const softNodes = Object.values(b2.nodes).filter(n => n.classification === 'ORGANIZATIONAL');
  const softPass = passRecords.filter(r => softNodes.some(n => n.node_id === r.node_id));

  switch (prism) {
    case 'INDEPENDENT_STAFFING_FIRM_OWNER':
      return { prism, score: totalNodes > 0 ? passCount / totalNodes : 0, reasoning: 'Verified target coverage ratio' };
    case 'SPORTS_AGENT': {
      const avgScore = passRecords.length > 0 ? passRecords.reduce((s, r) => s + r.binding_score, 0) / passRecords.length : 0;
      return { prism, score: avgScore, reasoning: 'Average binding strength' };
    }
    case 'DISCOVERY_SCOUT':
      return { prism, score: Math.min(domains.size / 5, 1), reasoning: `Domain diversity: ${domains.size} domains` };
    case 'SALES_HEADHUNTER':
      return { prism, score: softNodes.length > 0 ? softPass.length / softNodes.length : 0, reasoning: 'Soft/organizational coverage' };
    case 'CASTING_DIRECTOR':
      return { prism, score: hardNodes.length > 0 ? hardPass.length / hardNodes.length : 0, reasoning: 'Hard-core coverage' };
  }
}

function getProminence(weight: string, disposition: string): ProminenceClass {
  if (disposition !== 'PASS') return 'SUPPRESSED';
  if (weight === 'CRITICAL_STAR') return 'FOREGROUND';
  if (weight === 'STRONG_TILDE') return 'REINFORCEMENT';
  return 'BACKGROUND';
}

export function runB5(b2Result: B2Result, b4Result: B4Result): B5Result {
  checkAccess('B5', 'B4_LEDGER', 'READ');

  const propositions: VerifiedProposition[] = [];
  const gaps: UnresolvedGap[] = [];
  const allowedAssertions: string[] = [];
  const prohibitedImplications: string[] = [];

  let propIdx = 0;
  for (const record of b4Result.ledger) {
    const node = b2Result.nodes[record.node_id];
    if (!node) continue;

    const prominence = getProminence(node.weight, record.disposition);

    if (record.disposition === 'PASS') {
      propIdx++;
      propositions.push({
        proposition_id: `prop-${String(propIdx).padStart(3, '0')}`,
        originating_b4_node: record.node_id,
        target_address: node.address,
        target_requirement: node.label,
        target_weight: node.weight,
        atom_id: record.atom_id,
        domain: record.domain,
        statement: record.proposition,
        evidence_ceiling: record.evidence_ceiling,
        disposition: record.disposition,
        prominence_class: prominence,
        target_trace: record.target_trace,
        lineage: {
          B2_node: record.node_id,
          B3_atom: record.atom_id,
          B4_disposition: record.disposition,
          B5_prominence: prominence,
        },
      });
      allowedAssertions.push(`May assert: ${record.proposition}`);
    } else {
      gaps.push({
        node_id: record.node_id,
        target_requirement: node.label,
        status: 'EVIDENCE_GAP_MUST_NOT_FABRICATE',
      });
      prohibitedImplications.push(`Must NOT imply candidate meets: ${node.label}`);
    }
  }

  // Prism scoring
  const passRecords = b4Result.ledger.filter(r => r.disposition === 'PASS');
  const prismScores = PRISM_NAMES.map(p => scorePrism(p, passRecords, b4Result.ledger, b2Result));
  prismScores.sort((a, b) => b.score - a.score);
  const ownerPrism = prismScores[0]?.prism || 'INDEPENDENT_STAFFING_FIRM_OWNER';

  const distribution: Record<PrismName, number> = {} as any;
  for (const ps of prismScores) distribution[ps.prism] = Math.round(ps.score * 100) / 100;

  const prominenceCounts: Record<ProminenceClass, number> = { FOREGROUND: 0, REINFORCEMENT: 0, BACKGROUND: 0, SUPPRESSED: 0 };
  for (const p of propositions) prominenceCounts[p.prominence_class]++;
  prominenceCounts.SUPPRESSED += gaps.length;

  const semanticPriorities = propositions
    .filter(p => p.prominence_class === 'FOREGROUND')
    .map(p => p.target_requirement);

  const orderingGuidance = [
    'FOREGROUND propositions first',
    'REINFORCEMENT follows primary evidence',
    'BACKGROUND for supplementary context',
    'SUPPRESSED items excluded from C output',
  ];

  const writingBoundaries: WritingBoundaries = {
    assertiveness_ceiling: 'SUPPORTED_FACTUAL',
    allowed_assertions: allowedAssertions,
    prohibited_implications: prohibitedImplications,
  };

  const enhancementMetrics: Record<string, number> = {
    total_propositions: propositions.length,
    foreground_ratio: propositions.length > 0 ? prominenceCounts.FOREGROUND / propositions.length : 0,
    coverage_ratio: b4Result.ledger.length > 0 ? passRecords.length / b4Result.ledger.length : 0,
  };

  return {
    owner_prism: ownerPrism,
    ranked_prisms: prismScores,
    prism_distribution: distribution,
    prism_intro_evaluation: `${ownerPrism} lens selected with score ${prismScores[0]?.score.toFixed(2)}`,
    projection_posture: passRecords.length > b4Result.ledger.length / 2 ? 'STRONG' : passRecords.length > 0 ? 'MODERATE' : 'WEAK',
    verified_candidate_propositions: propositions,
    semantic_priorities: semanticPriorities,
    prominence_classes: prominenceCounts,
    writing_boundaries: writingBoundaries,
    ordering_guidance: orderingGuidance,
    unresolved_gaps: gaps,
    geometric_directives: ['Order by prominence class', 'Group by target address'],
    enhancement_metrics: enhancementMetrics,
    receipt: {
      stage: 'B5',
      timestamp: new Date().toISOString(),
      proposition_count: propositions.length,
      foreground_count: prominenceCounts.FOREGROUND,
      reinforcement_count: prominenceCounts.REINFORCEMENT,
      background_count: prominenceCounts.BACKGROUND,
      suppressed_count: prominenceCounts.SUPPRESSED,
      unresolved_count: gaps.length,
      owner_prism: ownerPrism,
    },
  };
}
