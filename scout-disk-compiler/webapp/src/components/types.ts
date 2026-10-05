// ═══════════════════════════════════════════════════════════════
// Scout Disk Compiler — Type Definitions
// ═══════════════════════════════════════════════════════════════

export interface IndustryCode {
  code: string;
  title: string;
}

export interface RoleCode {
  code: string;
  title: string;
}

export interface KeywordScope {
  target_soc: string;
  include: string[];
}

export interface Territory {
  zipCode: string;
  radiusMiles: number;
  coordinates?: { lat: number; lon: number };
}

export interface Keywords {
  logic: 'match_any_role_scope_and_exclude_global';
  scopes: KeywordScope[];
  optional_specialty_flags: string[];
  global_exclude: string[];
}

export type ObservationType = 'job_posting' | 'employer' | 'professional_profile' | 'provider' | 'business_location' | 'market_listing';
export type DiskStatus = 'draft' | 'active' | 'inactive' | 'retired';
export type ExecutionProfile = 'standard' | 'discovery' | 'research' | 'forensics' | 'strict';

export interface DiskDefinition {
  id: string;
  label: string;
  description: string;
  observation_type: ObservationType;
  version: string;
  status: DiskStatus;
  territory: Territory;
  industry: IndustryCode[];
  roles: RoleCode[];
  keywords: Keywords;
  execution_profile: ExecutionProfile;
}

export interface ExecutionProfileParams {
  limit: number;
  deduplicate: boolean;
  rank_results: boolean;
  strict_post_filter: boolean;
  deep_scrape: number;
  active_only: boolean;
}

export interface RingAssignment {
  source: [string, string];
  ring: string;
}

export interface MachinePayload {
  id: string;
  dsk: string;
  v: string;
  obs_type: string;
  contract: {
    output_fields: string[];
    deduplication: string;
    normalization: string;
  };
  loc: { z: string; r: number; ll?: [number, number] };
  tax: { n: string[]; s: string[] };
  rng_provenance: {
    resolver_version: string;
    resolution_basis: string;
    assignments: RingAssignment[];
  };
  kw_rules: {
    logic: string;
    role_scopes: KeywordScope[];
    exclude: string[];
    optional_flags: string[];
    rule: string;
  };
  exec: ExecutionProfileParams;
}

export interface CertificationBlock {
  status: 'UNCERTIFIED' | 'CERTIFIED';
  decision: 'NOT_READY' | 'READY';
  content_hash: string;
  hash_scope: string[];
}

export interface CompilationReport {
  status: 'SUCCESS' | 'FAILURE';
  metrics: {
    naics_count: number;
    soc_count: number;
    ring_assignment_count: number;
    keywords_count: number;
  };
}

export interface CartridgeMetadata {
  cartridge_id: string;
  disk_id: string;
  compilation_id: string;
  payload_id: string;
  schema_version: string;
  builder: string;
  compiler_version: string;
  compiled_at: string;
}

export interface Cartridge {
  metadata: CartridgeMetadata;
  certification: CertificationBlock;
  report: CompilationReport;
  definition: DiskDefinition;
  machine_payload: MachinePayload;
}

// Validator types
export interface ValidationCheck {
  id: number;
  name: string;
  passed: boolean;
  detail: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  certified_cartridge?: Cartridge;
}

// Gate types for ENVOY 1
export interface GateResult {
  gate: number;
  name: string;
  passed: boolean;
  detail: string;
}

export interface CandidateJob {
  title: string;
  employer: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  naics_code: string;
  soc_code: string;
  source_url: string;
  employment_type: string;
  compensation: string;
  description: string;
  is_active: boolean;
  vendor: string;
}

export interface CanonicalRow {
  Observation_ID: string;
  Collection_Date: string;
  Vendor: string;
  Employer: string;
  Job_Title: string;
  City: string;
  State: string;
  ZIP: string;
  Industry: string;
  Employment_Type: string;
  Compensation: string;
  Source_URL: string;
  Duplicate_Count: number;
}

export interface SemanticCategories {
  'Employment Type': string[];
  'Schedule': string[];
  'Compensation': string[];
  'Benefits': string[];
  'Experience': string[];
  'Education': string[];
  'Certifications': string[];
  'Leadership': string[];
  'Operations': string[];
  'Physical Requirements': string[];
  'Working Conditions': string[];
  'Skills': string[];
  'Responsibilities': string[];
  'Other': string[];
}

// Fact table entry for Traveling Envelope v0.2
export interface EnvelopeFact {
  text: string;
  category: string;
  qualifier: 'requirement' | 'preference' | 'availability';
  trace: string[];
}

export interface TravelingEnvelope {
  $schema: string;
  envelope_id: string;
  created_at: string;
  target_identity: {
    observation_id: string;
    employer: string;
    job_title: string;
    deduplication_key: string;
  };
  stage_state: {
    current_stage: string;
    completed_stages: string[];
    status: string;
  };
  append_history: Array<{
    stage: string;
    operation: string;
    timestamp: string;
  }>;
  payload: {
    scout: {
      path_a_structured: CanonicalRow;
      path_b_semantic: {
        categories: Partial<SemanticCategories>;
        fact_table: EnvelopeFact[];
        rule_log: string[];
        total_facts: number;
      };
      section_8_source: {
        source_text: string;
        source_hash: string;
        capture_timestamp: string;
        is_preserved_source: true;
      };
    };
    b: null;
    b1: null;
    b2: null;
    b3: null;
    b4: null;
    b5: null;
  };
}
