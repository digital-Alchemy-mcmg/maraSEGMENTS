// ═══════════════════════════════════════════════════════════════
// Scout Disk Compiler — Compilation & Validation Engine
// ═══════════════════════════════════════════════════════════════

import type {
  DiskDefinition, ExecutionProfile, ExecutionProfileParams,
  MachinePayload, Cartridge, ValidationCheck, ValidationResult,
  RingAssignment
} from './types';

// ── Execution Profile Registry ──
const PROFILE_REGISTRY: Record<ExecutionProfile, ExecutionProfileParams> = {
  standard:  { limit: 10,  deduplicate: true,  rank_results: false, strict_post_filter: true,  deep_scrape: 1, active_only: true },
  discovery: { limit: 50,  deduplicate: true,  rank_results: false, strict_post_filter: false, deep_scrape: 0, active_only: false },
  research:  { limit: 100, deduplicate: true,  rank_results: true,  strict_post_filter: true,  deep_scrape: 2, active_only: true },
  forensics: { limit: 250, deduplicate: false, rank_results: false, strict_post_filter: false, deep_scrape: 3, active_only: false },
  strict:    { limit: 25,  deduplicate: true,  rank_results: false, strict_post_filter: true,  deep_scrape: 2, active_only: true },
};

// ── SHA-256 Hashing (Web Crypto) ──
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Canonical JSON (sorted keys, no whitespace) ──
function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = keys.map(k => {
      const val = (obj as Record<string, unknown>)[k];
      return JSON.stringify(k) + ':' + canonicalStringify(val);
    });
    return '{' + pairs.join(',') + '}';
  }
  return String(obj);
}

// ── Disk Compiler ──
export function compileDisk(definition: DiskDefinition): Cartridge {
  const now = new Date().toISOString();
  const diskNumeric = definition.id.replace(/^DSK-/, '');

  // 1. Identifier Derivation
  const cartridgeId = 'CRT-' + diskNumeric;
  const compilationId = 'CMP-' + diskNumeric;
  const payloadId = 'PAY-' + diskNumeric;

  // 2. Taxonomy Flattening
  const naicsCodes = definition.industry.map(i => i.code);
  const socCodes = definition.roles.map(r => r.code);

  // 3. Ring Provenance (Cartesian Product)
  const assignments: RingAssignment[] = [];
  for (const n of naicsCodes) {
    for (const s of socCodes) {
      assignments.push({ source: [n, s], ring: 'R4' });
    }
  }

  // 4. Total keywords count
  const totalKw = definition.keywords.scopes.reduce((acc, s) => acc + s.include.length, 0)
    + definition.keywords.global_exclude.length
    + definition.keywords.optional_specialty_flags.length;

  // 5. Machine Payload
  const machinePayload: MachinePayload = {
    id: payloadId,
    dsk: definition.id,
    v: definition.version,
    obs_type: definition.observation_type,
    contract: {
      output_fields: [
        'Observation_ID', 'Collection_Date', 'Vendor', 'Employer', 'Job_Title',
        'City', 'State', 'ZIP', 'Industry', 'Employment_Type', 'Compensation',
        'Source_URL', 'Duplicate_Count'
      ],
      deduplication: 'sha256(normalize(url) + U+001F + normalize(employer))',
      normalization: 'NFKC_lowercase_trim_collapse',
    },
    loc: {
      z: definition.territory.zipCode,
      r: definition.territory.radiusMiles,
      ...(definition.territory.coordinates ? { ll: [definition.territory.coordinates.lat, definition.territory.coordinates.lon] as [number, number] } : {}),
    },
    tax: { n: naicsCodes, s: socCodes },
    rng_provenance: {
      resolver_version: '2.2.0',
      resolution_basis: 'deterministic_naics_soc_cartesian',
      assignments,
    },
    kw_rules: {
      logic: definition.keywords.logic,
      role_scopes: definition.keywords.scopes,
      exclude: definition.keywords.global_exclude,
      optional_flags: definition.keywords.optional_specialty_flags,
      rule: 'candidate_must_match_at_least_one_phrase_in_the_role_scope_for_its_target_soc; global_exclusion_match_rejects_candidate; optional_flags_do_not_affect_acceptance',
    },
    exec: PROFILE_REGISTRY[definition.execution_profile],
  };

  // 6. Assemble Uncertified Cartridge
  const cartridge: Cartridge = {
    metadata: {
      cartridge_id: cartridgeId,
      disk_id: definition.id,
      compilation_id: compilationId,
      payload_id: payloadId,
      schema_version: '2.2.0',
      builder: 'Scout Disk Studio v1.0',
      compiler_version: '2.2.0',
      compiled_at: now,
    },
    certification: {
      status: 'UNCERTIFIED',
      decision: 'NOT_READY',
      content_hash: 'sha256:pending',
      hash_scope: ['metadata', 'report', 'definition', 'machine_payload'],
    },
    report: {
      status: 'SUCCESS',
      metrics: {
        naics_count: naicsCodes.length,
        soc_count: socCodes.length,
        ring_assignment_count: assignments.length,
        keywords_count: totalKw,
      },
    },
    definition,
    machine_payload: machinePayload,
  };

  return cartridge;
}

// ── 25-Point Validator ──
export async function validateCartridge(cartridge: Cartridge): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];
  const c = cartridge;

  // Integrity Checks (1-8)
  checks.push({
    id: 1, name: 'Top-Level Structure',
    passed: !!(c.metadata && c.certification && c.report && c.definition && c.machine_payload),
    detail: 'All 5 top-level blocks present',
  });
  checks.push({
    id: 2, name: 'Schema Version',
    passed: c.metadata.schema_version === '2.2.0',
    detail: `Schema version: ${c.metadata.schema_version}`,
  });
  checks.push({
    id: 3, name: 'Disk ID Consistency',
    passed: c.metadata.disk_id === c.definition.id && c.definition.id === c.machine_payload.dsk,
    detail: `metadata=${c.metadata.disk_id}, def=${c.definition.id}, payload=${c.machine_payload.dsk}`,
  });
  checks.push({
    id: 4, name: 'Payload ID Consistency',
    passed: c.metadata.payload_id === c.machine_payload.id,
    detail: `metadata=${c.metadata.payload_id}, payload=${c.machine_payload.id}`,
  });
  checks.push({
    id: 5, name: 'Version Sync',
    passed: c.definition.version === c.machine_payload.v,
    detail: `def=${c.definition.version}, payload=${c.machine_payload.v}`,
  });
  checks.push({
    id: 6, name: 'Observation Type Sync',
    passed: c.definition.observation_type === c.machine_payload.obs_type,
    detail: `def=${c.definition.observation_type}, payload=${c.machine_payload.obs_type}`,
  });
  const hasCoords = !!c.definition.territory.coordinates;
  const coordsMatch = hasCoords
    ? c.definition.territory.coordinates!.lat === c.machine_payload.loc.ll?.[0]
      && c.definition.territory.coordinates!.lon === c.machine_payload.loc.ll?.[1]
    : !c.machine_payload.loc.ll;
  checks.push({
    id: 7, name: 'Territory Sync',
    passed: c.definition.territory.zipCode === c.machine_payload.loc.z
      && c.definition.territory.radiusMiles === c.machine_payload.loc.r
      && coordsMatch,
    detail: 'Territory ↔ loc synchronization',
  });

  const defNaics = c.definition.industry.map(i => i.code).sort().join(',');
  const payNaics = [...c.machine_payload.tax.n].sort().join(',');
  const defSoc = c.definition.roles.map(r => r.code).sort().join(',');
  const paySoc = [...c.machine_payload.tax.s].sort().join(',');
  checks.push({
    id: 8, name: 'Taxonomy Code Sync',
    passed: defNaics === payNaics && defSoc === paySoc,
    detail: 'NAICS and SOC codes match between definition and payload',
  });

  // Structure Checks (9-16)
  checks.push({
    id: 9, name: 'Disk ID Format',
    passed: /^DSK-[0-9]{6}$/.test(c.definition.id),
    detail: `ID: ${c.definition.id}`,
  });
  checks.push({
    id: 10, name: 'Cartridge ID Format',
    passed: /^CRT-[0-9]{6}$/.test(c.metadata.cartridge_id),
    detail: `Cartridge: ${c.metadata.cartridge_id}`,
  });
  checks.push({
    id: 11, name: 'Compilation ID Format',
    passed: /^CMP-[0-9]{6}$/.test(c.metadata.compilation_id),
    detail: `Compilation: ${c.metadata.compilation_id}`,
  });
  checks.push({
    id: 12, name: 'Payload ID Format',
    passed: /^PAY-[0-9]{6}$/.test(c.metadata.payload_id),
    detail: `Payload: ${c.metadata.payload_id}`,
  });
  checks.push({
    id: 13, name: 'Version Semantic Format',
    passed: /^\d+\.\d+\.\d+$/.test(c.definition.version),
    detail: `Version: ${c.definition.version}`,
  });
  checks.push({
    id: 14, name: 'ZIP Code Format',
    passed: /^\d{5}$/.test(c.definition.territory.zipCode),
    detail: `ZIP: ${c.definition.territory.zipCode}`,
  });
  checks.push({
    id: 15, name: 'Keyword Logic Valid',
    passed: c.definition.keywords.logic === 'match_any_role_scope_and_exclude_global',
    detail: `Logic: ${c.definition.keywords.logic}`,
  });
  checks.push({
    id: 16, name: 'Execution Profile Valid',
    passed: ['standard', 'discovery', 'research', 'forensics', 'strict'].includes(c.definition.execution_profile),
    detail: `Profile: ${c.definition.execution_profile}`,
  });

  // Content Checks (17-21)
  checks.push({
    id: 17, name: 'NAICS Present',
    passed: c.machine_payload.tax.n.length > 0,
    detail: `Count: ${c.machine_payload.tax.n.length}`,
  });
  checks.push({
    id: 18, name: 'SOC Present',
    passed: c.machine_payload.tax.s.length > 0,
    detail: `Count: ${c.machine_payload.tax.s.length}`,
  });
  checks.push({
    id: 19, name: 'Ring Assignments',
    passed: c.machine_payload.rng_provenance.assignments.length === c.machine_payload.tax.n.length * c.machine_payload.tax.s.length,
    detail: `Expected ${c.machine_payload.tax.n.length * c.machine_payload.tax.s.length}, got ${c.machine_payload.rng_provenance.assignments.length}`,
  });
  checks.push({
    id: 20, name: 'Contract Fields',
    passed: c.machine_payload.contract.output_fields.length === 13,
    detail: `Fields: ${c.machine_payload.contract.output_fields.length}`,
  });
  checks.push({
    id: 21, name: 'Label Present',
    passed: c.definition.label.trim().length > 0,
    detail: 'Non-empty label',
  });

  // Report Checks (22-23)
  checks.push({
    id: 22, name: 'Report Status',
    passed: c.report.status === 'SUCCESS',
    detail: `Status: ${c.report.status}`,
  });
  checks.push({
    id: 23, name: 'Report Metrics Consistent',
    passed: c.report.metrics.naics_count === c.machine_payload.tax.n.length
      && c.report.metrics.soc_count === c.machine_payload.tax.s.length,
    detail: 'Report metrics match payload taxonomy',
  });

  // Hash Scope Check (24)
  checks.push({
    id: 24, name: 'Hash Scope Defined',
    passed: c.certification.hash_scope.length === 4
      && c.certification.hash_scope.includes('metadata')
      && c.certification.hash_scope.includes('report')
      && c.certification.hash_scope.includes('definition')
      && c.certification.hash_scope.includes('machine_payload'),
    detail: `Scope: ${c.certification.hash_scope.join(', ')}`,
  });

  // SHA-256 Certification (25)
  const allPassed = checks.every(ch => ch.passed);
  if (allPassed) {
    const hashInput = {
      metadata: c.metadata,
      report: c.report,
      definition: c.definition,
      machine_payload: c.machine_payload,
    };
    const canonical = canonicalStringify(hashInput);
    const digest = await sha256(canonical);

    checks.push({
      id: 25, name: 'SHA-256 Certification',
      passed: true,
      detail: `sha256:${digest}`,
    });

    const certified: Cartridge = {
      ...c,
      certification: {
        ...c.certification,
        status: 'CERTIFIED',
        decision: 'READY',
        content_hash: `sha256:${digest}`,
      },
    };

    return { passed: true, checks, certified_cartridge: certified };
  } else {
    checks.push({
      id: 25, name: 'SHA-256 Certification',
      passed: false,
      detail: 'Cannot certify — prior checks failed',
    });
    return { passed: false, checks };
  }
}

// ── Haversine Distance (miles) ──
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Normalization Helpers ──
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    let path = u.pathname.replace(/\/+$/, '');
    if (!path) path = '';
    return (u.protocol + '//' + u.host.toLowerCase() + path).toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

export function normalizeEmployer(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function computeDedupKey(url: string, employer: string): Promise<string> {
  const input = normalizeUrl(url) + '\u001F' + normalizeEmployer(employer);
  return sha256(input);
}

export { sha256, canonicalStringify };
