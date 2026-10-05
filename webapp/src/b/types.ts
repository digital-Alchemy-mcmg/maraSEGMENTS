// ============================================================
// SEGMENT B — CORE TYPE DEFINITIONS
// ============================================================

// --- Identity State ---
export interface PipelineIdentity {
  run_id: string;
  candidate_id: string;
  target_id: string;
  pipeline_version: string;
  sdna_manifest_sha256: string;
  target_source_sha256: string;
}

// --- Stage Status ---
export type StageStatus = 'LOCKED' | 'READY' | 'RUNNING' | 'PASS' | 'SEALED' | 'FAIL';

export type StageName = 'INGRESS' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'T06' | 'EXPORT';

export interface StageProgression {
  INGRESS: StageStatus;
  B1: StageStatus;
  B2: StageStatus;
  B3: StageStatus;
  B4: StageStatus;
  B5: StageStatus;
  T06: StageStatus;
  EXPORT: StageStatus;
}

// --- A Envelope ---

/** Canonical A_scout taxonomy as received from Segment A */
export interface RawRequirementsTaxonomy {
  hard_requirements: string[];
  soft_requirements: string[];
  keyword_lexicon: string[];
}

/** Target entity from A_scout */
export interface TargetEntity {
  company_name?: string;
  job_title?: string;
  [key: string]: any;
}

export interface AScout {
  target_entity?: TargetEntity;
  /** After hydration this is the normalized RequirementTaxonomy[] for B1/B2 consumption.
   *  The raw canonical shape (RawRequirementsTaxonomy object) is converted during envelope hydration. */
  requirements_taxonomy: RequirementTaxonomy[];
  /** Preserved reference to the original canonical taxonomy object */
  _raw_taxonomy?: RawRequirementsTaxonomy;
  original_content_sha256: string;
  source_url?: string;
  [key: string]: any;
}

export interface RequirementTaxonomy {
  requirement_id: string;
  label: string;
  classification: 'HARD_REQUIREMENT' | 'SOFT_REQUIREMENT';
  wording: string;
  [key: string]: any;
}

export interface ZState {
  run_id: string;
  candidate_id: string;
  target_id: string;
  pipeline_version: string;
  sdna_manifest_sha256?: string;
  current_stage: string;
  status: string;
  [key: string]: any;
}

export interface SealedAEnvelope {
  Z_state: ZState;
  A_scout: AScout;
  history?: any[];
  audit_trail?: any[];
  timestamps?: Record<string, string>;
  [key: string]: any;
}

// --- Sidecar ---
export interface SidecarRunBinding {
  run_id: string;
  target_id: string;
}

export interface StageASidecar {
  run_binding: SidecarRunBinding;
  raw_posting: string;
  raw_html?: string;
  original_content_sha256: string;
  [key: string]: any;
}

// --- SDNA ---
export interface SDNAAtom {
  atom_id: string;
  content: string;
  domain: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface CandidateSDNA {
  candidate_id: string;
  manifest_version?: string;
  atoms: SDNAAtom[];
  integrity?: {
    content_sha256?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// --- Candidate Vault ---
export interface CandidateVaultState {
  mounted: boolean;
  candidate_id: string;
  display_name: string;
  canonical_manifest_sha256: string;
  raw_yaml_sha256: string;
  atoms: SDNAAtom[];
  atom_index: Map<string, SDNAAtom>;
  source_registry: Record<string, any>;
}

// --- B1 ---
export interface B1Tag {
  tag_id: string;
  requirement_label: string;
  classification: 'HARD_REQUIREMENT' | 'SOFT_REQUIREMENT';
  source_match: boolean;
  span_start: number;
  span_end: number;
  source_excerpt: string;
}

export interface B1Result {
  tags: B1Tag[];
  receipt: B1Receipt;
}

export interface B1Receipt {
  stage: 'B1';
  timestamp: string;
  tag_count: number;
  matched_count: number;
  unmatched_count: number;
  target_source_sha256: string;
}

// --- B2 ---
export type NodeClassification = 'HARD_CORE' | 'ORGANIZATIONAL';
export type NodeWeight = 'CRITICAL_STAR' | 'STRONG_TILDE';

export interface SourceTrace {
  tag_id: string;
  source_match: boolean;
  span_start: number;
  span_end: number;
  source_excerpt: string;
}

export interface CompetencyNode {
  node_id: string;
  address: string;
  label: string;
  classification: NodeClassification;
  weight: NodeWeight;
  source_trace: SourceTrace;
}

export interface B2Result {
  root_role: string;
  nodes: Record<string, CompetencyNode>;
  frozen_tree_sha256: string;
  receipt: B2Receipt;
}

export interface B2Receipt {
  stage: 'B2';
  timestamp: string;
  node_count: number;
  hard_core_count: number;
  organizational_count: number;
  frozen_tree_sha256: string;
}

// --- B3 ---
export type BindingStatus = 'BOUND' | 'UNBOUND';

export interface EvidenceBinding {
  node_id: string;
  bound_atom_id: string | null;
  atom_content: string | null;
  domain: string | null;
  binding_score: number;
  binding_basis: string[];
  status: BindingStatus;
}

export interface B3Result {
  bindings: EvidenceBinding[];
  receipt: B3Receipt;
}

export interface B3Receipt {
  stage: 'B3';
  timestamp: string;
  total_bindings: number;
  bound_count: number;
  unbound_count: number;
}

// --- B4 ---
export type Disposition = 'PASS' | 'UNRESOLVED' | 'REJECTED_INTEGRITY';
export type EvidenceCeiling = 'SUPPORTED_FACTUAL' | 'NONE';

export interface AuditRecord {
  node_id: string;
  atom_id: string | null;
  domain: string | null;
  disposition: Disposition;
  evidence_ceiling: EvidenceCeiling;
  proposition: string;
  binding_score: number;
  candidate_atom_integrity_verified: boolean;
  target_trace: SourceTrace;
}

export interface CandidateIdentity {
  candidate_id: string;
  sdna_manifest_sha256: string;
}

export interface B4Result {
  ledger: AuditRecord[];
  candidate_identity: CandidateIdentity;
  admitted_bindings: number;
  ledger_sha256: string;
  tag_layer_purged: boolean;
  tag_layer_sha256: string;
  receipt: B4Receipt;
}

export interface B4Receipt {
  stage: 'B4';
  timestamp: string;
  pass_count: number;
  unresolved_count: number;
  rejected_count: number;
  match_percentage: number;
  ledger_sha256: string;
  tag_layer_purged: boolean;
  tag_layer_sha256: string;
}

// --- B5 ---
export type PrismName =
  | 'INDEPENDENT_STAFFING_FIRM_OWNER'
  | 'SPORTS_AGENT'
  | 'DISCOVERY_SCOUT'
  | 'SALES_HEADHUNTER'
  | 'CASTING_DIRECTOR';

export type ProminenceClass = 'FOREGROUND' | 'REINFORCEMENT' | 'BACKGROUND' | 'SUPPRESSED';

export interface VerifiedProposition {
  proposition_id: string;
  originating_b4_node: string;
  target_address: string;
  target_requirement: string;
  target_weight: NodeWeight;
  atom_id: string | null;
  domain: string | null;
  statement: string;
  evidence_ceiling: EvidenceCeiling;
  disposition: Disposition;
  prominence_class: ProminenceClass;
  target_trace: SourceTrace;
  lineage: {
    B2_node: string;
    B3_atom: string | null;
    B4_disposition: Disposition;
    B5_prominence: ProminenceClass;
  };
}

export interface UnresolvedGap {
  node_id: string;
  target_requirement: string;
  status: 'EVIDENCE_GAP_MUST_NOT_FABRICATE';
}

export interface WritingBoundaries {
  assertiveness_ceiling: 'SUPPORTED_FACTUAL';
  allowed_assertions: string[];
  prohibited_implications: string[];
}

export interface PrismScore {
  prism: PrismName;
  score: number;
  reasoning: string;
}

export interface B5Result {
  owner_prism: PrismName;
  ranked_prisms: PrismScore[];
  prism_distribution: Record<PrismName, number>;
  prism_intro_evaluation: string;
  projection_posture: string;
  verified_candidate_propositions: VerifiedProposition[];
  semantic_priorities: string[];
  prominence_classes: Record<ProminenceClass, number>;
  writing_boundaries: WritingBoundaries;
  ordering_guidance: string[];
  unresolved_gaps: UnresolvedGap[];
  geometric_directives: string[];
  enhancement_metrics: Record<string, number>;
  receipt: B5Receipt;
}

export interface B5Receipt {
  stage: 'B5';
  timestamp: string;
  proposition_count: number;
  foreground_count: number;
  reinforcement_count: number;
  background_count: number;
  suppressed_count: number;
  unresolved_count: number;
  owner_prism: PrismName;
}

// --- T06 ---
export interface TraceWalk {
  B5_DECISION: string;
  B4_LEDGER: string;
  B3_ATOM: string | null;
  B2_TARGET_TRACE: string;
  SIDECAR_SOURCE: boolean;
  THREE_WAY_HASH: boolean;
}

export interface TraceReceipt {
  verifier_id: string;
  result: 'PASS' | 'FAIL';
  verified_walk: TraceWalk[];
  three_way_match: boolean;
  recomputed_sidecar_hash: string;
  anchors_checked: number;
  errors: string[];
}

// --- Termination ---
export interface SidecarAttestation {
  status: 'TERMINATED_AND_VERIFIED';
  destruction_verification: {
    method: 'APPLICATION_REFERENCE_PURGE';
    owned_references_unreachable: boolean;
    physical_memory_zeroization_guaranteed: false;
    scope: 'application/runtime object graph only';
  };
}

// --- Sealed B Envelope ---
export interface BLayer {
  competency_tree: B2Result;
  b4_ledger: B4Result;
  b5_projection: B5Result;
  B_sidecar_attestation: SidecarAttestation;
}

export interface SealedBEnvelope extends SealedAEnvelope {
  B_sdna: BLayer;
}

// --- Gate Receipt ---
export interface GateBReceipt {
  run_id: string;
  candidate_id: string;
  target_id: string;
  pipeline_version: string;
  ingress_passed: boolean;
  stages_completed: StageName[];
  t06_result: 'PASS' | 'FAIL';
  c1_ready: boolean;
  timestamp: string;
  identity: PipelineIdentity;
}

// --- B Context ---
export interface BContext {
  identity: PipelineIdentity;
  envelope: SealedAEnvelope;
  sidecar: StageASidecar;
  vault: CandidateVaultState;
  stageProgression: StageProgression;
  b1Result?: B1Result;
  b2Result?: B2Result;
  b3Result?: B3Result;
  b4Result?: B4Result;
  b5Result?: B5Result;
  t06Result?: TraceReceipt;
  sidecarAttestation?: SidecarAttestation;
  errors: string[];
}

// --- Access Control ---
export type AccessLevel = 'READ' | 'WRITE' | 'NO' | 'PURGE' | 'FORBIDDEN' | 'HASH_ONLY' | 'PASS_THROUGH' | 'VERIFY';

export interface AccessMatrix {
  RAW_TARGET_TEXT: Record<string, AccessLevel>;
  RAW_HTML: Record<string, AccessLevel>;
  TEMPORARY_TARGET_TAGS: Record<string, AccessLevel>;
  CANDIDATE_SDNA_ATOMS: Record<string, AccessLevel>;
  B4_LEDGER: Record<string, AccessLevel>;
  B5_PROJECTION: Record<string, AccessLevel>;
}

// --- Test ---
export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  duration_ms: number;
}
