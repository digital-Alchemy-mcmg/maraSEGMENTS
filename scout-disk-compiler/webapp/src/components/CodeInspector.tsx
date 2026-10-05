// ═══════════════════════════════════════════════════════════════
// Scout — Code Inspector (Cold Base Inspection Layer)
// Full transparency into every executing function, gate,
// regex, derivation, and validation rule.
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { base, colors } from './styles';

// ── The actual source logic, extracted verbatim for inspection ──

interface CodeBlock {
  id: string;
  section: string;
  title: string;
  specRef: string;
  description: string;
  code: string;
  notes?: string;
}

const CODE_BLOCKS: CodeBlock[] = [
  // ═══ COMPILER ENGINE ═══
  {
    id: 'sha256',
    section: 'Compiler Engine',
    title: 'SHA-256 Hashing (Web Crypto)',
    specRef: 'Spec §4.4 — Canonical Hashing',
    description: 'Core hashing primitive used by the Validator (content_hash), Gate 10 (dedup_key), and Section 8 (source_hash). Uses Web Crypto SubtleCrypto.digest — no external libraries.',
    code: `async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}`,
    notes: 'Input is always a UTF-8 string. Output is lowercase hex. This matches the Python reference: hashlib.sha256(s.encode("utf-8")).hexdigest().',
  },
  {
    id: 'canonical-stringify',
    section: 'Compiler Engine',
    title: 'Canonical JSON Serialization',
    specRef: 'Spec §4.4 — Step 2: "Serialize to UTF-8 JSON with lexicographically sorted keys, no whitespace after delimiters (separators=(\',\', \':\'))"',
    description: 'Deterministic JSON serializer. Keys are sorted lexicographically at every nesting depth. No spaces after colons or commas. This ensures identical inputs always produce identical hash digests regardless of insertion order.',
    code: `function canonicalStringify(obj: unknown): string {
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
}`,
    notes: 'Python equivalent: json.dumps(obj, sort_keys=True, separators=(",", ":")). Array order is preserved (not sorted) — only object keys are sorted. Strings use JSON.stringify() to get proper escaping.',
  },
  {
    id: 'identifier-derivation',
    section: 'Compiler Engine',
    title: 'Identifier Derivation',
    specRef: 'Spec §3.1 — Compilation Algorithm Step 1',
    description: 'All IDs are derived deterministically from the disk_id by stripping the DSK- prefix and prepending the target prefix. No random generation. Same input always produces same output.',
    code: `const diskNumeric = definition.id.replace(/^DSK-/, '');

const cartridgeId   = 'CRT-' + diskNumeric;   // DSK-000001 → CRT-000001
const compilationId = 'CMP-' + diskNumeric;    // DSK-000001 → CMP-000001
const payloadId     = 'PAY-' + diskNumeric;    // DSK-000001 → PAY-000001
const timestamp     = new Date().toISOString(); // UTC ISO-8601`,
    notes: 'The regex /^DSK-/ anchors to the start. If the ID does not start with DSK-, the replace is a no-op — the validator will catch the malformed ID at Check #9.',
  },
  {
    id: 'taxonomy-flattening',
    section: 'Compiler Engine',
    title: 'Taxonomy Flattening',
    specRef: 'Spec §3.1 — Compilation Algorithm Step 2',
    description: 'Extracts flat code arrays from the structured industry/roles objects for use in the machine payload.',
    code: `const naicsCodes = definition.industry.map(i => i.code);
// [{code:"541511", title:"Custom Computer Programming Services"}]
//   → ["541511"]

const socCodes = definition.roles.map(r => r.code);
// [{code:"15-1252", title:"Software Developers"}]
//   → ["15-1252"]`,
    notes: 'Order is preserved from input. Titles are retained in the definition block but stripped from the payload tax arrays for compactness.',
  },
  {
    id: 'ring-provenance',
    section: 'Compiler Engine',
    title: 'Ring Provenance Generation (Cartesian Product)',
    specRef: 'Spec §3.1 — Compilation Algorithm Step 3',
    description: 'Generates all NAICS × SOC pairings. Each pair gets a standard ring assignment of "R4". The expected count is always naics_count × soc_count.',
    code: `const assignments: RingAssignment[] = [];
for (const n of naicsCodes) {
  for (const s of socCodes) {
    assignments.push({ source: [n, s], ring: 'R4' });
  }
}

// Example: naics=["541511","541512"], soc=["15-1252"]
// → [{source:["541511","15-1252"], ring:"R4"},
//    {source:["541512","15-1252"], ring:"R4"}]`,
    notes: 'Validator Check #19 verifies: assignments.length === naics_count × soc_count. If these don\'t match, the cartridge cannot be certified.',
  },
  {
    id: 'keyword-count',
    section: 'Compiler Engine',
    title: 'Total Keyword Count Derivation',
    specRef: 'Spec §3.1 — Compilation Algorithm Step 4 (metrics)',
    description: 'Sums all keyword terms across scopes, global excludes, and optional flags for the compilation report.',
    code: `const totalKw = definition.keywords.scopes
  .reduce((acc, s) => acc + s.include.length, 0) // role scope terms
  + definition.keywords.global_exclude.length      // exclusion terms
  + definition.keywords.optional_specialty_flags.length; // optional flags`,
    notes: 'This is a flat count, not unique count. Duplicates across scopes are counted separately. The report.metrics.keywords_count must match this value.',
  },
  {
    id: 'execution-profiles',
    section: 'Compiler Engine',
    title: 'Execution Profile Registry',
    specRef: 'Spec §2 — Execution Profile Registry',
    description: 'Static lookup table mapping profile name → engine parameters. The compiler resolves the profile string to its concrete parameter set.',
    code: `const PROFILE_REGISTRY = {
  standard:  { limit: 10,  deduplicate: true,  rank_results: false,
               strict_post_filter: true,  deep_scrape: 1, active_only: true  },
  discovery: { limit: 50,  deduplicate: true,  rank_results: false,
               strict_post_filter: false, deep_scrape: 0, active_only: false },
  research:  { limit: 100, deduplicate: true,  rank_results: true,
               strict_post_filter: true,  deep_scrape: 2, active_only: true  },
  forensics: { limit: 250, deduplicate: false, rank_results: false,
               strict_post_filter: false, deep_scrape: 3, active_only: false },
  strict:    { limit: 25,  deduplicate: true,  rank_results: false,
               strict_post_filter: true,  deep_scrape: 2, active_only: true  },
};`,
    notes: 'Key pipeline implications: forensics.deduplicate=false means Gate 11 never rejects. discovery.active_only=false means Gate 3 passes inactive listings. strict.limit=25 caps output at 25 accepted observations.',
  },
  {
    id: 'payload-assembly',
    section: 'Compiler Engine',
    title: 'Machine Payload Assembly (Short-Key Schema)',
    specRef: 'Spec §3.1 — Compilation Algorithm Step 4',
    description: 'Constructs the machine-readable payload with abbreviated keys as specified. This is the block that ENVOY 1 reads during pipeline execution.',
    code: `const machinePayload: MachinePayload = {
  id: payloadId,               // "PAY-000001"
  dsk: definition.id,           // "DSK-000001"
  v: definition.version,        // "1.0.0"
  obs_type: definition.observation_type,  // "job_posting"
  contract: {
    output_fields: [
      'Observation_ID','Collection_Date','Vendor','Employer',
      'Job_Title','City','State','ZIP','Industry',
      'Employment_Type','Compensation','Source_URL','Duplicate_Count'
    ],                          // exactly 13 fields
    deduplication: 'sha256(normalize(url) + U+001F + normalize(employer))',
    normalization: 'NFKC_lowercase_trim_collapse',
  },
  loc: {
    z: definition.territory.zipCode,        // "80202"
    r: definition.territory.radiusMiles,     // 25
    ll: [coordinates.lat, coordinates.lon],  // [39.7392, -104.9903]
  },
  tax: { n: naicsCodes, s: socCodes },
  rng_provenance: {
    resolver_version: '2.2.0',
    resolution_basis: 'deterministic_naics_soc_cartesian',
    assignments: assignments,
  },
  kw_rules: {
    logic: definition.keywords.logic,
    role_scopes: definition.keywords.scopes,
    exclude: definition.keywords.global_exclude,
    optional_flags: definition.keywords.optional_specialty_flags,
    rule: 'candidate_must_match_at_least_one_phrase_in_the_role' +
          '_scope_for_its_target_soc; global_exclusion_match_' +
          'rejects_candidate; optional_flags_do_not_affect_acceptance',
  },
  exec: PROFILE_REGISTRY[definition.execution_profile],
};`,
    notes: 'Validator Checks #3-#8 cross-reference this payload against the definition to ensure nothing was corrupted during assembly. Check #20 verifies contract.output_fields.length === 13.',
  },

  // ═══ 25-POINT VALIDATOR ═══
  {
    id: 'validator-integrity',
    section: '25-Point Validator',
    title: 'Integrity Checks (Checks 1–8)',
    specRef: 'Spec §4 — Cartridge Certification, Integrity Checks',
    description: 'Cross-reference checks ensuring the cartridge is internally consistent. These verify that the compiler wired everything correctly.',
    code: `// Check 1: All 5 top-level blocks present
!!(c.metadata && c.certification && c.report
   && c.definition && c.machine_payload)

// Check 2: Schema version is supported
c.metadata.schema_version === '2.2.0'

// Check 3: Disk ID consistency across 3 locations
c.metadata.disk_id === c.definition.id
  && c.definition.id === c.machine_payload.dsk

// Check 4: Payload ID consistency
c.metadata.payload_id === c.machine_payload.id

// Check 5: Version sync
c.definition.version === c.machine_payload.v

// Check 6: Observation type sync
c.definition.observation_type === c.machine_payload.obs_type

// Check 7: Territory coordinate sync (4 values)
c.definition.territory.zipCode === c.machine_payload.loc.z
  && c.definition.territory.radiusMiles === c.machine_payload.loc.r
  && c.definition.territory.coordinates.lat === c.machine_payload.loc.ll[0]
  && c.definition.territory.coordinates.lon === c.machine_payload.loc.ll[1]

// Check 8: Taxonomy code sync (sorted comparison)
const defNaics = c.definition.industry.map(i => i.code).sort().join(',');
const payNaics = [...c.machine_payload.tax.n].sort().join(',');
defNaics === payNaics  // and same for SOC`,
    notes: 'These are order-independent (sort before compare). If any of 1-8 fail, the cartridge is structurally broken — the compiler has a bug.',
  },
  {
    id: 'validator-structure',
    section: '25-Point Validator',
    title: 'Structure Checks (Checks 9–16)',
    specRef: 'Spec §4 — Format validation',
    description: 'Regex and enum checks on ID formats, version strings, ZIP codes, keyword logic, and execution profile names.',
    code: `// Check 9:  Disk ID format
/^DSK-[0-9]{6}$/.test(c.definition.id)

// Check 10: Cartridge ID format
/^CRT-[0-9]{6}$/.test(c.metadata.cartridge_id)

// Check 11: Compilation ID format
/^CMP-[0-9]{6}$/.test(c.metadata.compilation_id)

// Check 12: Payload ID format
/^PAY-[0-9]{6}$/.test(c.metadata.payload_id)

// Check 13: Semantic version format
/^\\d+\\.\\d+\\.\\d+$/.test(c.definition.version)

// Check 14: US ZIP code format (5 digits)
/^\\d{5}$/.test(c.definition.territory.zipCode)

// Check 15: Keyword logic must be exact string
c.definition.keywords.logic
  === 'match_any_role_scope_and_exclude_global'

// Check 16: Profile must be in allowed enum
['standard','discovery','research','forensics','strict']
  .includes(c.definition.execution_profile)`,
    notes: 'Check 13 allows any X.Y.Z but does not enforce that X/Y/Z are reasonable numbers. Check 14 does not validate the ZIP exists — only format.',
  },
  {
    id: 'validator-content',
    section: '25-Point Validator',
    title: 'Content Checks (17–21) & Report Checks (22–24)',
    specRef: 'Spec §4 — Content and Report validation',
    description: 'Ensures the payload has substance (non-empty taxonomies, correct ring count, all 13 output fields) and that report metrics are consistent.',
    code: `// Check 17: At least one NAICS code
c.machine_payload.tax.n.length > 0

// Check 18: At least one SOC code
c.machine_payload.tax.s.length > 0

// Check 19: Ring count = NAICS × SOC (Cartesian invariant)
c.machine_payload.rng_provenance.assignments.length
  === c.machine_payload.tax.n.length * c.machine_payload.tax.s.length

// Check 20: Exactly 13 contract output fields
c.machine_payload.contract.output_fields.length === 13

// Check 21: Non-empty label
c.definition.label.trim().length > 0

// Check 22: Report status is SUCCESS
c.report.status === 'SUCCESS'

// Check 23: Report metrics match payload
c.report.metrics.naics_count === c.machine_payload.tax.n.length
  && c.report.metrics.soc_count === c.machine_payload.tax.s.length

// Check 24: Hash scope contains exactly 4 correct keys
c.certification.hash_scope.length === 4
  && ['metadata','report','definition','machine_payload']
       .every(k => c.certification.hash_scope.includes(k))`,
  },
  {
    id: 'validator-hash',
    section: '25-Point Validator',
    title: 'Check 25: SHA-256 Certification (Hash & Sign)',
    specRef: 'Spec §4.4 — Canonical Hashing, Steps 1-5',
    description: 'Only runs if Checks 1-24 all pass. Extracts the 4 hash_scope blocks (strictly excluding certification), serializes canonically, computes SHA-256, and stamps the cartridge as CERTIFIED/READY.',
    code: `// Step 1: Extract only hash_scope keys (omit certification)
const hashInput = {
  metadata:        c.metadata,
  report:          c.report,
  definition:      c.definition,
  machine_payload: c.machine_payload,
};

// Step 2: Canonical serialization (sorted keys, no whitespace)
const canonical = canonicalStringify(hashInput);

// Step 3: SHA-256 digest
const digest = await sha256(canonical);

// Step 4-5: Stamp certification
certification.content_hash = 'sha256:' + digest;
certification.status   = 'CERTIFIED';
certification.decision = 'READY';`,
    notes: 'CRITICAL: The certification block itself is NOT included in the hash input. This prevents circular hashing. If you modify any field in metadata, report, definition, or machine_payload after certification, the hash will no longer match — the cartridge becomes tamper-evident.',
  },

  // ═══ ENVOY 1 — 12 GATES ═══
  {
    id: 'gate-4-haversine',
    section: 'ENVOY 1 — Collection Gates',
    title: 'Gate 4: Territory Boundary (Haversine Formula)',
    specRef: 'Spec §B.1 Gate 4 — Haversine distance, d ≤ loc.r miles',
    description: 'Computes great-circle distance between the cartridge center point and the candidate job coordinates. Rejects if distance exceeds the configured radius.',
    code: `function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180)
    * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Gate evaluation:
const dist = haversineDistance(
  mp.loc.ll[0], mp.loc.ll[1],  // cartridge center
  cand.lat, cand.lon            // candidate location
);
const passed = dist <= mp.loc.r; // e.g., 5.2 <= 25 → true`,
    notes: 'R = 3958.8 miles (mean Earth radius). This is the standard Haversine formula from the spec. Note: this is great-circle distance, not driving distance.',
  },
  {
    id: 'gate-8-exclusion',
    section: 'ENVOY 1 — Collection Gates',
    title: 'Gate 8: Global Exclusion Precedence',
    specRef: 'Spec §B.1 Gate 8 — "If any excluded term matches (case-insensitive phrase), reject candidate"',
    description: 'Checks the concatenated title + description against each global_exclude term. Case-insensitive substring match. Any single hit rejects the entire candidate.',
    code: `// Search space: title + description concatenated
const descLower = (cand.title + ' ' + cand.description).toLowerCase();

// Check each exclusion term
const excluded = mp.kw_rules.exclude.find(
  term => descLower.includes(term.toLowerCase())
);

const passed = !excluded;
// If excluded is truthy, it's the matched term string`,
    notes: 'The spec says "case-insensitive phrase" — this uses .toLowerCase().includes() which is a substring match, not word-boundary. So "unpaid" will match "unpaid" inside "an unpaid internship" and also inside "sunpaidfor" (edge case). The spec does not require word boundaries.',
  },
  {
    id: 'gate-9-role-scope',
    section: 'ENVOY 1 — Collection Gates',
    title: 'Gate 9: Role Scope Inclusion',
    specRef: 'Spec §B.1 Gate 9 — "Candidate must match at least one phrase in kw_rules.role_scopes[candidate_soc]"',
    description: 'Finds the role scope matching the candidate\'s SOC code, then checks if at least one include term appears in the posting text. If no scope exists for that SOC, the gate passes (no constraint).',
    code: `// Find matching scope for this candidate's SOC
const scope = mp.kw_rules.role_scopes.find(
  s => s.target_soc === cand.soc_code
);

// If scope exists, at least one term must match
const passed = !scope || scope.include.some(
  term => descLower.includes(term.toLowerCase())
);

// Example scope: { target_soc: "15-1252",
//   include: ["python", "react", "fastapi"] }
// descLower contains "python" → passes`,
    notes: 'The fallthrough (!scope → pass) means unscoped SOC codes are unrestricted. This is by design — the spec says the rule only applies "for its target_soc".',
  },
  {
    id: 'gate-10-dedup-key',
    section: 'ENVOY 1 — Collection Gates',
    title: 'Gate 10: Deduplication Key Derivation',
    specRef: 'Spec §B.1 Gate 10 — SHA-256(norm(url) + U+001F + norm(employer))',
    description: 'Normalizes the URL and employer name independently, joins them with the ASCII Unit Separator (U+001F), and hashes the result. This is the canonical dedup identity.',
    code: `function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';  // strip query params
    u.hash = '';    // strip fragments
    let path = u.pathname.replace(/\\/+$/, ''); // strip trailing slashes
    if (!path) path = '';
    return (u.protocol + '//' + u.host.toLowerCase() + path)
      .toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function normalizeEmployer(name: string): string {
  return name
    .normalize('NFKC')      // Unicode NFKC normalization
    .trim()                  // strip outer whitespace
    .replace(/\\s+/g, ' ')  // collapse inner whitespace
    .toLowerCase();          // lowercase
}

async function computeDedupKey(
  url: string, employer: string
): Promise<string> {
  const input = normalizeUrl(url)
    + '\\u001F'              // ASCII Unit Separator
    + normalizeEmployer(employer);
  return sha256(input);
}`,
    notes: 'normalizeUrl: "https://Jobs.Acme.com/Senior-SWE-123?ref=google" → "https://jobs.acme.com/senior-swe-123". normalizeEmployer: "  Acme  Corp  " → "acme corp". The U+001F separator prevents collisions between url-tail and employer-head.',
  },
  {
    id: 'gate-11-batch-dedup',
    section: 'ENVOY 1 — Collection Gates',
    title: 'Gate 11: Batch Deduplication',
    specRef: 'Spec §B.1 Gate 11 — "If dedup_key was previously seen, increment Duplicate_Count and filter as dictated by exec.deduplicate"',
    description: 'Tracks seen dedup keys across the entire run. If exec.deduplicate is true and the key was seen before, the candidate is rejected. If false (forensics profile), duplicates pass through.',
    code: `const dedupSeen = new Map<string, number>();

// For each candidate:
const prevCount = dedupSeen.get(dedupKey) || 0;
dedupSeen.set(dedupKey, prevCount + 1);

const passed = !mp.exec.deduplicate || prevCount === 0;
// deduplicate=true  + first occurrence → pass
// deduplicate=true  + second occurrence → REJECT
// deduplicate=false + any occurrence → pass`,
    notes: 'The Duplicate_Count in the canonical row reflects total occurrences (including the accepted one). So the first-seen candidate gets Duplicate_Count = 1, not 0.',
  },
  {
    id: 'gate-12-canonical-row',
    section: 'ENVOY 1 — Collection Gates',
    title: 'Gate 12: Canonical Row Assembly (13 Fields)',
    specRef: 'Spec §B.1 Gate 12 — Canonical 13-field record',
    description: 'For accepted candidates, assembles the standard observation record. The Observation_ID is derived from the dedup key hash.',
    code: `// Only runs if Gates 1-11 all passed

const obsId = 'OBS-'
  + dedupKey.substring(0, 12).toUpperCase();
// e.g., "OBS-4F1A8C9B2E3D"

const canonical: CanonicalRow = {
  Observation_ID:  obsId,
  Collection_Date: new Date().toISOString().split('T')[0],
  Vendor:          cand.vendor,
  Employer:        cand.employer,       // verbatim
  Job_Title:       cand.title,          // verbatim
  City:            cand.city,
  State:           cand.state,          // 2-letter code
  ZIP:             cand.zip,            // or null
  Industry:        naicsCode + ' — ' + naicsTitle,
  Employment_Type: cand.employment_type, // or null
  Compensation:    cand.compensation,    // raw text or null
  Source_URL:      cand.source_url,      // direct URL
  Duplicate_Count: dedupSeen.get(dedupKey)!, // min 1
};`,
    notes: 'Observation_ID uses first 12 hex chars of the dedup_key SHA-256, uppercased. This gives 48 bits of collision space — sufficient for batch sizes up to 250 (forensics limit).',
  },

  // ═══ ENVOY 2 — SEMANTIC DECOMPOSITION ═══
  {
    id: 'decomp-rules',
    section: 'ENVOY 2 — Semantic Engine',
    title: '12-Rule Decomposition Engine (Deterministic Cold Base)',
    specRef: 'Spec §B.2 — 12 Strict Decomposition Rules',
    description: 'Full deterministic engine — TypeScript port of the Python reference v2.2.0. No AI, no LLM. Every rule is a named, exported, pure function. Same input always produces same output. Executes rules in fixed order: 1→2→5→classify→10→11→9.',
    code: `// PIPELINE ORDER: rule1 → rule2 → rule5 → classify → rule10 → rule11 → rule9

function decomposeDescription(text: string): DecompResult {
  // Rule 1: Atomize sentences
  const atoms = rule1_atomize(text);

  for (const sentence of atoms) {
    // Rule 2: Strip pronouns
    sentence = rule2_strip_pronouns(sentence);

    // Rule 5: Remove marketing fluff
    const cleaned = rule5_remove_fluff(sentence);
    if (cleaned === null) continue; // entire sentence was fluff

    // Rules 3,4,7,8,12: Guaranteed by deterministic regex
    //   (no interpretation, no inference, verbatim preservation)

    // Classify into one of 14 categories
    const category = classify_category(cleaned);

    // Rule 10: Preference vs. requirement
    const qualifier = rule10_classify_qualifier(cleaned);

    // Rule 11: Availability override
    const isAvail = rule11_is_availability(cleaned);
    const finalQualifier = isAvail ? 'availability' : qualifier;

    facts.push({ text: cleaned, category, qualifier: finalQualifier,
                 rule_trace: [...] });
  }

  // Rule 9: Deduplicate by lowercase identity
  return rule9_deduplicate(facts);
}`,
    notes: 'Each rule is an independently callable function exported from decomposition-engine.ts. The rule_trace on each fact records exactly which rules fired and what they did. The rule_log on the result records the full pipeline trace. You can verify any individual rule by importing it and calling it with test input.',
  },
  {
    id: 'decomp-rule1',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Rule 1: Sentence Atomization',
    specRef: 'Spec §B.2 Rule 1 — "Compound sentences must be split into atomic assertions"',
    description: 'Two-phase split: first on terminal punctuation [.;!?], then on compound conjunctions (", and " / ", or ") when both halves are substantial clauses (≥20 chars).',
    code: `function rule1_atomize(text: string): string[] {
  // Phase 1: Split on terminal punctuation
  const raw = text.split(/(?<=[.;!?])\\s+/);
  const atoms: string[] = [];

  for (const segment of raw) {
    const trimmed = segment.replace(/[.;!?]+$/, '').trim();
    if (trimmed.length < 5) continue;

    // Phase 2: Split compound clauses on ", and " / ", or "
    // Only if BOTH halves are ≥ 20 chars (substantial clauses)
    const conjSplit = trimmed.split(
      /,\\s+(?:and|or)\\s+|;\\s+(?:and|or)\\s+/i
    );
    if (conjSplit.length > 1
        && conjSplit.every(p => p.trim().length >= 20)) {
      for (const part of conjSplit) {
        if (part.trim().length >= 5) atoms.push(part.trim());
      }
    } else {
      atoms.push(trimmed);
    }
  }
  return atoms;
}`,
    notes: 'The 20-char threshold prevents splitting short lists like "Python, and React" into useless fragments. The lookbehind (?<=[.;!?]) ensures we split AFTER punctuation, preserving sentence integrity.',
  },
  {
    id: 'decomp-rule2',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Rule 2: Pronoun Stripping',
    specRef: 'Spec §B.2 Rule 2 — "Strip unreferenced personal pronouns"',
    description: 'Removes leading pronoun+verb patterns that add no factual content. Two-pass: first handles "We are looking for..." patterns, then simpler "We need..." patterns.',
    code: `function rule2_strip_pronouns(text: string): string {
  // Pass 1: Pronoun + aux + seeking verb
  let result = text.replace(
    /^(we|you|they|he|she|it|our team|the team|the company)
     \\s+(are|is|will be|will|would|should|must be|need)
     \\s+(looking for|seeking|hiring|searching for|in need of)
     \\s*/i,
    ''
  );

  // Pass 2: Simpler pronoun + verb
  result = result.replace(
    /^(we|you|they)
     \\s+(need|want|require|offer|provide|expect|have)
     \\s+/i,
    ''
  );

  // Re-capitalize if stripped
  if (result !== text && result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}`,
    notes: 'Only strips LEADING pronouns — mid-sentence pronouns are preserved since they may reference specific antecedents. The re-capitalization ensures the output reads as a proper sentence.',
  },
  {
    id: 'decomp-rule5',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Rule 5: Marketing Fluff Removal',
    specRef: 'Spec §B.2 Rule 5 — "Strip all recruiting fluff"',
    description: 'Tests against a bank of 17+ fluff patterns. If the entire sentence is fluff (< 30 chars remain after removal), returns null to drop it. Otherwise, strips just the fluff phrase.',
    code: `const FLUFF_PATTERNS = [
  /\\bjoin our\\b/i,
  /\\bfast[- ]paced\\b/i,
  /\\bdynamic (?:culture|environment|team)\\b/i,
  /\\bexciting opportunity\\b/i,
  /\\bamazing team\\b/i,
  /\\bworld[- ]class\\b/i,
  /\\bgame[- ]chang/i,
  /\\brockstar\\b/i, /\\bninja\\b/i, /\\bguru\\b/i,
  /\\bpassionate about\\b/i,
  /\\bthrive in\\b/i,
  /\\bmake (?:a |an )?(?:impact|difference)\\b/i,
  /\\bcutting[- ]edge\\b/i,
  /\\binnovative...\\s+(?:environment|culture|team)\\b/i,
  /\\bwork hard[,]?\\s*play hard\\b/i,
  /\\bfamily[- ](?:like|oriented)...\\b/i,
  /\\bwe['\u2019]re (?:looking for|seeking)
   (?:a |an )?(?:passionate|motivated|driven)\\b/i,
];

function rule5_remove_fluff(text: string): string | null {
  for (const pattern of FLUFF_PATTERNS) {
    if (pattern.test(text)) {
      const stripped = text.replace(pattern, '').trim();
      if (stripped.length < 30) return null; // entire fluff
      return stripped;                       // partial fluff
    }
  }
  return text; // no fluff detected
}`,
    notes: 'Returns null (drop) vs. string (keep). The 30-char threshold distinguishes "Join our amazing team!" (all fluff → drop) from "Join our team building distributed Python systems" (fluff intro + real content → strip intro, keep content).',
  },
  {
    id: 'decomp-rule10',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Rule 10: Preference vs. Requirement Separation',
    specRef: 'Spec §B.2 Rule 10 — "Distinguish mandatory requirements from desirable qualifications"',
    description: 'Scans for preference signals (preferred, nice to have, a plus) and requirement signals (must, required, mandatory). Preference signals take priority if both match. Default is requirement.',
    code: `const PREFERENCE_SIGNALS = [
  /\\bpreferred\\b/i, /\\bprefer(?:ably|ence)?\\b/i,
  /\\ba plus\\b/i, /\\bnice to have\\b/i,
  /\\bdesirable\\b/i, /\\bideally\\b/i,
  /\\bbonus\\b/i, /\\bnot required\\b/i,
  /\\boptional\\b/i, /\\bhelpful\\b/i,
  /\\badvantageous\\b/i,
];

const REQUIREMENT_SIGNALS = [
  /\\bmust\\b/i, /\\brequired\\b/i,
  /\\bminimum\\b/i, /\\bmandatory\\b/i,
  /\\bessential\\b/i, /\\bnecessary\\b/i,
  /\\bshall\\b/i,
];

function rule10_classify_qualifier(text): 'requirement'|'preference' {
  // Preference signals checked FIRST (take priority)
  for (const pat of PREFERENCE_SIGNALS)
    if (pat.test(text)) return 'preference';
  for (const pat of REQUIREMENT_SIGNALS)
    if (pat.test(text)) return 'requirement';
  return 'requirement'; // default
}`,
    notes: 'Preference signals are checked first so "AWS certification preferred but required for senior roles" correctly returns "preference" — the first match wins. The Python reference uses the same priority order.',
  },
  {
    id: 'decomp-rule11',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Rule 11: Availability vs. Requirement',
    specRef: 'Spec §B.2 Rule 11 — "Distinguish shift/schedule availability from qualifications"',
    description: 'Detects schedule/availability language and overrides the qualifier to "availability" regardless of Rule 10\'s classification.',
    code: `const AVAILABILITY_PATTERNS = [
  /\\b(?:available|availability)\\s+(?:to|for)
   \\s+(?:work|travel|start)/i,
  /\\b(?:monday|tuesday|...|sunday)
   \\s+(?:through|to|[-\u2013])\\s+/i,
  /\\b(?:first|second|third|day|night|swing|graveyard|
       evening|morning)\\s+shift\\b/i,
  /\\b(?:on[- ]call|overtime|weekends?|holidays?)
   \\s+(?:required|expected|as needed)/i,
  /\\b(?:flexible|rotating)\\s+(?:schedule|hours|shifts)\\b/i,
  /\\b(?:\\d{1,2}:\\d{2}\\s*(?:am|pm|AM|PM))\\b/,
];

function rule11_is_availability(text: string): boolean {
  return AVAILABILITY_PATTERNS.some(pat => pat.test(text));
}

// In pipeline: overrides Rule 10 qualifier
const finalQualifier = rule11_is_availability(text)
  ? 'availability'
  : rule10_classify_qualifier(text);`,
    notes: 'This runs AFTER Rule 10. If a sentence says "Must be available for night shift", Rule 10 would say "requirement" (due to "must"), but Rule 11 overrides to "availability" because shift language is detected.',
  },
  {
    id: 'decomp-classifier',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Category Classifier (14 Categories, Ordered Precedence)',
    specRef: 'Spec §B.2 — "Categorize each atomic fact into exactly one of 14 categories"',
    description: 'Ordered pattern bank with 100+ regex patterns across all 14 categories. First matching category wins. Covers Schedule, Employment Type, Compensation, Benefits, Experience, Education, Certifications, Physical Requirements, Working Conditions, Leadership, Operations, Skills, Responsibilities, and Other.',
    code: `const CATEGORY_RULES: Array<[Category, RegExp[]]> = [
  ['Schedule',       [/\\bmonday|tuesday|...|sunday\\b/i,
                      /\\b(?:day|night|swing)\\s+shift\\b/i, ...]],
  ['Employment Type',[/\\bfull[- ]time\\b/i, /\\bcontract\\b/i,
                      /\\bfreelance\\b/i, /\\b1099\\b/i, ...]],
  ['Compensation',   [/\\$[\\d,]+/i, /\\bsalary\\b/i,
                      /\\bstock\\s+options?\\b/i, ...]],
  ['Benefits',       [/\\bhealth\\s+insurance\\b/i, /\\b401k\\b/i,
                      /\\bparental\\s+leave\\b/i, ...]],
  ['Experience',     [/\\b\\d+\\+?\\s*years?...experience\\b/i,
                      /\\bhands[- ]on\\s+experience\\b/i, ...]],
  ['Education',      [/\\bbachelor['']?s?\\s+degree\\b/i,
                      /\\b(?:BS|MS|MBA|PhD)\\b/, ...]],
  ['Certifications', [/\\bcertif(?:ied|ication)\\b/i,
                      /\\b(?:AWS|PMP|CISSP|CCNA)\\b/, ...]],
  ['Physical Req.',  [/\\blift...\\d+\\s*lbs?\\b/i,
                      /\\bstand...for\\b/i, ...]],
  ['Working Cond.',  [/\\bremote\\b/i, /\\bhybrid\\b/i,
                      /\\btravel\\s+\\d+%/i, ...]],
  ['Leadership',     [/\\bmanag(?:e|ing)\\b/i, /\\bmentor/i,
                      /\\bstrategic\\s+planning\\b/i, ...]],
  ['Operations',     [/\\bbudget\\b/i, /\\bsupply\\s+chain\\b/i,
                      /\\bKPI\\b/i, ...]],
  ['Skills',         [/\\bpython\\b/i, /\\breact\\b/i,
                      /\\bdocker\\b/i, /\\bagile\\b/i, ...]],
  ['Responsibilities',[/\\bresponsible\\b/i, /\\bability\\s+to\\b/i,
                       /\\bcollaborat(?:e|ing)\\s+with\\b/i, ...]],
];

function classify_category(text: string): Category {
  for (const [category, patterns] of CATEGORY_RULES)
    for (const pat of patterns)
      if (pat.test(text)) return category;
  return 'Other';
}`,
    notes: 'Category order matters for precedence — Schedule is checked BEFORE Working Conditions because shift-specific language is more specific. Skills has the broadest regex bank (tech stack patterns). The full pattern bank has 100+ regexes — see decomposition-engine.ts for the complete list.',
  },
  {
    id: 'section-8-source',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Section 8: Source Block (Immutability Anchor)',
    specRef: 'Spec §B.2 — Section 8 Source Block',
    description: 'Stores the verbatim, unedited source text alongside its SHA-256 hash. This is the tamper-evidence seal on the raw input — if the description is altered, the hash won\'t match.',
    code: `const sourceHash = await sha256(cand.description);
const now = new Date().toISOString();

const section_8_source = {
  source_text:       cand.description,   // verbatim, unedited
  source_hash:       'sha256:' + sourceHash,
  capture_timestamp: now,                // ISO-8601 UTC
  is_preserved_source: true,             // boolean flag
};`,
    notes: 'The source_text is NEVER modified — no trimming, no lowercasing, no normalization. The hash is computed over the exact byte sequence. This is the ground truth for downstream audit.',
  },
  {
    id: 'envelope-assembly',
    section: 'ENVOY 2 — Semantic Engine',
    title: 'Traveling Envelope v0.2 Assembly',
    specRef: 'Spec §B.3 — Traveling Envelope v0.2 Packaging',
    description: 'Wraps the dual-path output (structured + semantic + source) into the standard handoff schema. Stage state is set to "b" (next stage) with scout in completed_stages.',
    code: `const envelope: TravelingEnvelope = {
  $schema: 'https://json-schema.spatial-dna.org/v0.2/envelope.json',
  envelope_id: 'ENV-' + obsId,  // e.g., "ENV-OBS-4F1A8C9B2E3D"
  created_at: now,
  target_identity: {
    observation_id:    obsId,
    employer:          cand.employer,
    job_title:         cand.title,
    deduplication_key: dedupKey,   // full 64-char hex
  },
  stage_state: {
    current_stage:    'b',         // handoff target
    completed_stages: ['scout'],   // we just finished scout
    status:           'ready',
  },
  append_history: [{
    stage:     'scout',
    operation: 'initialize_and_append',
    timestamp: now,
  }],
  payload: {
    scout: {
      path_a_structured: canonical,         // 13-field row
      path_b_semantic:   { categories, total_facts },
      section_8_source:  { source_text, source_hash, ... },
    },
    b: null, b1: null, b2: null,
    b3: null, b4: null, b5: null,           // future stages
  },
};`,
    notes: 'current_stage="b" means execution halts at the Scout output boundary. Downstream stages (b through b5) are null placeholders. The append_history is an ordered log — each stage appends its entry.',
  },
];

const SECTIONS = [...new Set(CODE_BLOCKS.map(b => b.section))];

export default function CodeInspector() {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedBlocks(new Set(filtered.map(b => b.id)));
  const collapseAll = () => setExpandedBlocks(new Set());

  const filtered = CODE_BLOCKS.filter(b => {
    const matchSection = activeSection === 'All' || b.section === activeSection;
    const matchSearch = !searchTerm || 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSection && matchSearch;
  });

  return (
    <div>
      {/* Search + Controls */}
      <div style={{ ...base.card, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            style={base.input}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="🔍  Search code, functions, regex, notes..."
          />
        </div>
        <button style={{ ...base.btn, ...base.btnPrimary, padding: '8px 14px' }} onClick={expandAll}>Expand All</button>
        <button style={{ ...base.btn, padding: '8px 14px', backgroundColor: colors.surfaceAlt, color: colors.textDim }} onClick={collapseAll}>Collapse All</button>
        <span style={{ fontSize: '12px', color: colors.textMuted }}>
          {filtered.length} / {CODE_BLOCKS.length} blocks
        </span>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {['All', ...SECTIONS].map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            style={{
              ...base.btn,
              padding: '6px 14px',
              fontSize: '11px',
              backgroundColor: activeSection === s ? colors.accent : colors.surface,
              color: activeSection === s ? '#fff' : colors.textDim,
              border: `1px solid ${activeSection === s ? colors.accent : colors.border}`,
            }}
          >
            {s === 'Compiler Engine' ? '⚙️' :
             s === '25-Point Validator' ? '🔐' :
             s === 'ENVOY 1 — Collection Gates' ? '🚪' :
             s === 'ENVOY 2 — Semantic Engine' ? '🧠' : '📋'} {s}
          </button>
        ))}
      </div>

      {/* Code Blocks */}
      {filtered.map(block => {
        const expanded = expandedBlocks.has(block.id);
        return (
          <div key={block.id} style={{ ...base.card, borderLeft: `3px solid ${
            block.section === 'Compiler Engine' ? colors.accent :
            block.section === '25-Point Validator' ? colors.purple :
            block.section === 'ENVOY 1 — Collection Gates' ? colors.warning :
            colors.cyan
          }` }}>
            {/* Header (always visible) */}
            <div
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              onClick={() => toggleBlock(block.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                  {expanded ? '▼' : '▶'} {block.title}
                </div>
                <div style={{ fontSize: '11px', color: colors.textMuted, ...base.mono }}>{block.specRef}</div>
              </div>
              <span style={{
                ...base.badge,
                backgroundColor: block.section === 'Compiler Engine' ? 'rgba(59,130,246,0.1)' :
                  block.section === '25-Point Validator' ? colors.purpleBg :
                  block.section === 'ENVOY 1 — Collection Gates' ? colors.warningBg :
                  colors.cyanBg,
                color: block.section === 'Compiler Engine' ? colors.accent :
                  block.section === '25-Point Validator' ? colors.purple :
                  block.section === 'ENVOY 1 — Collection Gates' ? colors.warning :
                  colors.cyan,
                fontSize: '10px',
              }}>
                {block.section.split(' — ')[0]}
              </span>
            </div>

            {/* Expanded Content */}
            {expanded && (
              <div style={{ marginTop: '12px' }}>
                {/* Description */}
                <div style={{ fontSize: '13px', color: colors.textDim, marginBottom: '12px', lineHeight: 1.6 }}>
                  {block.description}
                </div>

                {/* Code */}
                <pre style={{
                  fontFamily: "'Amazon Ember Mono', 'Fira Code', monospace",
                  fontSize: '12px',
                  lineHeight: 1.7,
                  backgroundColor: '#050810',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  padding: '16px',
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                  margin: 0,
                  color: '#c9d1d9',
                }}>
                  {block.code}
                </pre>

                {/* Notes */}
                {block.notes && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(245,158,11,0.05)',
                    border: `1px solid rgba(245,158,11,0.2)`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: colors.textDim,
                    whiteSpace: 'pre-wrap',
                  }}>
                    <strong style={{ color: colors.warning }}>⚠ Inspection Notes:</strong>{'\n'}{block.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ ...base.card, textAlign: 'center', padding: '40px', color: colors.textMuted }}>
          No code blocks match your search.
        </div>
      )}
    </div>
  );
}
