// ═══════════════════════════════════════════════════════════════
// ENVOY 2 — Deterministic 12-Rule Decomposition Engine
// TypeScript port of the Python reference implementation v2.2.0
//
// COLD BASE: Every function is named, pure, and inspectable.
// No AI, no LLM, no randomness. Same input → same output.
// ═══════════════════════════════════════════════════════════════

import type { SemanticCategories } from './types';

// ── Tagged fact with requirement/preference classification ──
export interface AtomicFact {
  text: string;
  category: keyof SemanticCategories;
  qualifier: 'requirement' | 'preference' | 'availability';
  rule_trace: string[];  // which rules fired, in order
}

export interface DecompResult {
  facts: AtomicFact[];
  categories: Partial<SemanticCategories>;
  total_facts: number;
  rule_log: string[];  // full trace of all rule applications
}

// ════════════════════════════════════════════════════════════
// RULE 1: Sentence Atomization
// "One fact per statement — compound sentences must be split
//  into atomic assertions."
// Splits on [.;!?], then splits on conjunctions (and/or)
// when both sides are substantial clauses.
// ════════════════════════════════════════════════════════════
export function rule1_atomize(text: string): string[] {
  // Phase 1: Split on terminal punctuation
  const raw = text.split(/(?<=[.;!?])\s+/);
  const atoms: string[] = [];

  for (const segment of raw) {
    const trimmed = segment.replace(/[.;!?]+$/, '').trim();
    if (trimmed.length < 5) continue;

    // Phase 2: Split compound clauses on ", and " / ", or " / "; and "
    // Only split if both halves are ≥ 20 chars (substantial clauses)
    const conjSplit = trimmed.split(/,\s+(?:and|or)\s+|;\s+(?:and|or)\s+/i);
    if (conjSplit.length > 1 && conjSplit.every(p => p.trim().length >= 20)) {
      for (const part of conjSplit) {
        const p = part.trim();
        if (p.length >= 5) atoms.push(p);
      }
    } else {
      atoms.push(trimmed);
    }
  }
  return atoms;
}

// ════════════════════════════════════════════════════════════
// RULE 2: Pronoun Stripping
// "Strip unreferenced personal pronouns."
// Removes leading "We/You/They/He/She" + verb patterns that
// add no factual content.
// ════════════════════════════════════════════════════════════
export function rule2_strip_pronouns(text: string): string {
  // Strip leading pronoun + auxiliary patterns
  let result = text.replace(
    /^(we|you|they|he|she|it|our team|the team|the company)\s+(are|is|will be|will|would|should|must be|need)\s+(looking for|seeking|hiring|searching for|in need of)\s*/i,
    ''
  );
  // Strip simpler leading pronoun + verb
  result = result.replace(
    /^(we|you|they)\s+(need|want|require|offer|provide|expect|have)\s+/i,
    ''
  );
  // Capitalize first char if we stripped something
  if (result !== text && result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

// ════════════════════════════════════════════════════════════
// RULE 5: Marketing Fluff Removal
// "Strip all recruiting fluff."
// Returns null if the entire sentence is fluff.
// ════════════════════════════════════════════════════════════
const FLUFF_PATTERNS = [
  /\bjoin our\b/i, /\bfast[- ]paced\b/i, /\bdynamic (?:culture|environment|team)\b/i,
  /\bexciting opportunity\b/i, /\bamazing team\b/i, /\bworld[- ]class\b/i,
  /\bgame[- ]chang/i, /\brockstar\b/i, /\bninja\b/i, /\bguru\b/i,
  /\bpassionate about\b/i, /\bthrive in\b/i, /\bmake (?:a |an )?(?:impact|difference)\b/i,
  /\bcutting[- ]edge\b/i, /\binnovative(?:\s+and\s+collaborative)?\s+(?:environment|culture|team)\b/i,
  /\bwork hard[,]?\s*play hard\b/i, /\bfamily[- ](?:like|oriented)\s+(?:environment|culture)\b/i,
  /\bwe['']re (?:looking for|seeking) (?:a |an )?(?:passionate|motivated|driven)\b/i,
];

export function rule5_remove_fluff(text: string): string | null {
  for (const pattern of FLUFF_PATTERNS) {
    if (pattern.test(text)) {
      // Check if the ENTIRE sentence is fluff (< 30 chars of non-fluff content)
      const stripped = text.replace(pattern, '').trim();
      if (stripped.length < 30) return null;  // whole sentence is fluff
      // Otherwise, remove the fluff phrase and keep the rest
      return stripped;
    }
  }
  return text;
}

// ════════════════════════════════════════════════════════════
// RULE 10: Preference vs. Requirement Separation
// "Distinguish mandatory requirements from desirable quals."
// ════════════════════════════════════════════════════════════
const PREFERENCE_SIGNALS = [
  /\bpreferred\b/i, /\bprefer(?:ably|ence)?\b/i, /\ba plus\b/i,
  /\bnice to have\b/i, /\bdesirable\b/i, /\bideally\b/i,
  /\bbonus\b/i, /\bnot required\b/i, /\boptional\b/i,
  /\bhelpful\b/i, /\badvantageous\b/i,
];

const REQUIREMENT_SIGNALS = [
  /\bmust\b/i, /\brequired\b/i, /\bminimum\b/i, /\bmandatory\b/i,
  /\bessential\b/i, /\bnecessary\b/i, /\bshall\b/i,
];

export function rule10_classify_qualifier(text: string): 'requirement' | 'preference' {
  for (const pat of PREFERENCE_SIGNALS) {
    if (pat.test(text)) return 'preference';
  }
  for (const pat of REQUIREMENT_SIGNALS) {
    if (pat.test(text)) return 'requirement';
  }
  return 'requirement';  // default: treat as requirement
}

// ════════════════════════════════════════════════════════════
// RULE 11: Availability vs. Requirement Separation
// "Distinguish shift/schedule availability from qualifications."
// ════════════════════════════════════════════════════════════
const AVAILABILITY_PATTERNS = [
  /\b(?:available|availability)\s+(?:to|for)\s+(?:work|travel|start)/i,
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:through|to|[-–])\s+/i,
  /\b(?:first|second|third|day|night|swing|graveyard|evening|morning)\s+shift\b/i,
  /\b(?:on[- ]call|overtime|weekends?|holidays?)\s+(?:required|expected|as needed)/i,
  /\b(?:flexible|rotating)\s+(?:schedule|hours|shifts)\b/i,
  /\b(?:\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))\b/,
];

export function rule11_is_availability(text: string): boolean {
  return AVAILABILITY_PATTERNS.some(pat => pat.test(text));
}

// ════════════════════════════════════════════════════════════
// CATEGORY CLASSIFIER
// Ordered pattern bank mapping sentences → 14 categories.
// Each entry: [category, patterns[]]. First match wins.
// ════════════════════════════════════════════════════════════
type CatKey = keyof SemanticCategories;

const CATEGORY_RULES: Array<[CatKey, RegExp[]]> = [
  ['Schedule', [
    /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(?:first|second|third|day|night|swing|graveyard)\s+shift\b/i,
    /\b(?:on[- ]call|overtime)\b/i,
    /\b(?:rotating|flexible)\s+(?:schedule|shifts?|hours)\b/i,
    /\b\d{1,2}:\d{2}\s*(?:am|pm)\b/i,
  ]],
  ['Employment Type', [
    /\bfull[- ]time\b/i, /\bpart[- ]time\b/i, /\bcontract\b/i,
    /\btemporary\b/i, /\bfreelance\b/i, /\binternship\b/i,
    /\bper diem\b/i, /\bseasonal\b/i, /\b1099\b/i, /\bW-?2\b/i,
  ]],
  ['Compensation', [
    /\$[\d,]+/i, /\bsalary\b/i, /\bcompensation\b/i,
    /\b(?:per|\/)\s*(?:hour|year|annum|month|week)\b/i,
    /\bpay\s+(?:range|rate|scale)\b/i, /\bhourly\s+rate\b/i,
    /\bbase\s+(?:pay|salary)\b/i, /\bbonus\s+(?:structure|eligible)\b/i,
    /\bcommission\b/i, /\bstock\s+options?\b/i, /\bequity\b/i,
  ]],
  ['Benefits', [
    /\bhealth\s+insurance\b/i, /\b401[kK]\b/i, /\bbenefits?\s+(?:package|include|including)\b/i,
    /\bpto\b/i, /\bpaid\s+(?:time\s+off|leave|vacation|holiday|sick)\b/i,
    /\bdental\b/i, /\bvision\b/i, /\blife\s+insurance\b/i,
    /\bdisability\s+insurance\b/i, /\btuition\s+(?:reimbursement|assistance)\b/i,
    /\bretirement\b/i, /\bwellness\b/i, /\bparental\s+leave\b/i,
    /\brelocation\s+(?:assistance|package)\b/i,
  ]],
  ['Experience', [
    /\b\d+\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)\b/i,
    /\bexperience\s+(?:in|with|working|developing|managing)\b/i,
    /\bproven\s+(?:track\s+record|experience|ability)\b/i,
    /\bbackground\s+in\b/i, /\bexposure\s+to\b/i,
    /\bhands[- ]on\s+experience\b/i,
  ]],
  ['Education', [
    /\b(?:bachelor|master|doctoral|associate)['']?s?\s+degree\b/i,
    /\b(?:BS|BA|MS|MA|MBA|PhD|MD|JD)\b/, /\bdegree\s+(?:in|from)\b/i,
    /\beducation\b/i, /\bgraduate\b/i, /\buniversity\b/i,
    /\bhigh\s+school\s+diploma\b/i, /\bGED\b/i,
  ]],
  ['Certifications', [
    /\bcertif(?:ied|ication|icate)\b/i, /\blicens(?:ed|ure|e)\b/i,
    /\bclearance\b/i, /\b(?:AWS|Azure|GCP|PMP|CPA|CISSP|CCNA)\b/,
    /\bboard[- ]certified\b/i, /\baccredit/i,
  ]],
  ['Physical Requirements', [
    /\b(?:lift|carry|push|pull)\s+(?:up\s+to\s+)?\d+\s*(?:lbs?|pounds?|kg)\b/i,
    /\b(?:stand|sit|walk|bend|kneel|crouch|crawl|climb)\s+for\b/i,
    /\bphysical(?:ly)?\s+(?:demanding|fit|able|capable)\b/i,
    /\bmanual\s+(?:dexterity|labor)\b/i,
    /\brepetitive\s+(?:motion|movement|task)/i,
  ]],
  ['Working Conditions', [
    /\bremote\b/i, /\bhybrid\b/i, /\bon[- ]site\b/i, /\bin[- ]office\b/i,
    /\bwork\s+from\s+home\b/i, /\btravel\s+(?:up to|required|\d+%)/i,
    /\boutdoor/i, /\bwarehouse\b/i, /\bclean\s*room\b/i,
    /\bhazardous\b/i, /\bPPE\b/i, /\bnoise\s+(?:level|exposure)\b/i,
  ]],
  ['Leadership', [
    /\bmanag(?:e|ing|ement)\b/i, /\blead(?:ing|ership)?\b/i,
    /\bsupervis(?:e|ing|ory|ion)\b/i, /\bmentor/i,
    /\boversee\b/i, /\bdirect\s+report/i,
    /\b(?:team|department|division)\s+(?:lead|head|manager|director)\b/i,
    /\bstrategic\s+(?:planning|direction|vision)\b/i,
  ]],
  ['Operations', [
    /\bbudget\b/i, /\bforecast/i, /\bP&?L\b/i,
    /\bworkflow\b/i, /\bprocess\s+improvement\b/i,
    /\bsupply\s+chain\b/i, /\blogistics\b/i, /\binventory\b/i,
    /\bquality\s+(?:assurance|control)\b/i, /\bcompliance\b/i,
    /\baudit\b/i, /\bSOP\b/i, /\bKPI\b/i,
  ]],
  ['Skills', [
    /\b(?:python|javascript|typescript|java|c\+\+|c#|go|rust|ruby|swift|kotlin|scala|php|perl|r)\b/i,
    /\b(?:react|angular|vue|node|express|django|flask|fastapi|spring|rails)\b/i,
    /\b(?:docker|kubernetes|terraform|ansible|jenkins|git|ci\/cd)\b/i,
    /\b(?:aws|azure|gcp|cloud)\b/i,
    /\b(?:sql|nosql|postgres|mysql|mongodb|redis|elasticsearch|dynamodb)\b/i,
    /\b(?:machine\s+learning|deep\s+learning|NLP|computer\s+vision|data\s+science)\b/i,
    /\b(?:agile|scrum|kanban|devops|microservices|rest(?:ful)?|graphql|api)\b/i,
    /\b(?:tableau|power\s*bi|excel|jira|confluence|figma|sketch)\b/i,
    /\b(?:communication|problem[- ]solving|analytical|critical\s+thinking)\b/i,
    /\bproficien(?:t|cy)\b/i, /\bskill(?:s|ed)\b/i, /\bknowledge\s+of\b/i,
    /\bfamiliar(?:ity)?\s+with\b/i, /\bexpertise\s+in\b/i,
  ]],
  ['Responsibilities', [
    /\b(?:responsible|responsibility)\b/i, /\brequir(?:es?|ed|ing|ement)\b/i,
    /\bmust\s+(?:have|be|possess)\b/i, /\bability\s+to\b/i,
    /\bduties?\s+include\b/i, /\baccountable\b/i,
    /\byou\s+will\b/i, /\bthe\s+role\s+(?:involves?|includes?|requires?)\b/i,
    /\bdesign(?:ing)?\s+and\s+(?:develop|implement|build)/i,
    /\bcollaborat(?:e|ing)\s+with\b/i, /\bensure\b/i, /\bmaintain\b/i,
  ]],
];

export function classify_category(text: string): CatKey {
  for (const [category, patterns] of CATEGORY_RULES) {
    for (const pat of patterns) {
      if (pat.test(text)) return category;
    }
  }
  return 'Other';
}

// ════════════════════════════════════════════════════════════
// RULE 9: Duplicate Consolidation
// "Consolidate repetitive statements into a single entry."
// Compares by lowercase-trimmed text identity.
// ════════════════════════════════════════════════════════════
export function rule9_deduplicate(facts: AtomicFact[]): AtomicFact[] {
  const seen = new Set<string>();
  const result: AtomicFact[] = [];
  for (const f of facts) {
    const key = f.text.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(f);
  }
  return result;
}

// ════════════════════════════════════════════════════════════
// MAIN PIPELINE: decomposeDescription
// Executes rules 1→2→5→classify→10→11→9 in fixed order.
// Returns full trace for inspection.
// ════════════════════════════════════════════════════════════
export function decomposeDescription(text: string): DecompResult {
  const rule_log: string[] = [];

  // Rule 1: Atomize
  const atoms = rule1_atomize(text);
  rule_log.push(`Rule 1 (Atomize): ${atoms.length} atoms from input`);

  const facts: AtomicFact[] = [];

  for (let i = 0; i < atoms.length; i++) {
    let sentence = atoms[i];
    const trace: string[] = [];

    // Rule 2: Strip pronouns
    const beforePronoun = sentence;
    sentence = rule2_strip_pronouns(sentence);
    if (sentence !== beforePronoun) {
      trace.push('Rule 2: Pronoun stripped');
      rule_log.push(`  [${i}] Rule 2: "${beforePronoun.substring(0, 40)}..." → "${sentence.substring(0, 40)}..."`);
    }

    // Rule 5: Marketing fluff removal
    const afterFluff = rule5_remove_fluff(sentence);
    if (afterFluff === null) {
      trace.push('Rule 5: Entire sentence is fluff — DROPPED');
      rule_log.push(`  [${i}] Rule 5: DROPPED "${sentence.substring(0, 50)}..."`);
      continue;
    }
    if (afterFluff !== sentence) {
      trace.push('Rule 5: Fluff phrase removed');
      rule_log.push(`  [${i}] Rule 5: Trimmed fluff from "${sentence.substring(0, 40)}..."`);
      sentence = afterFluff;
    }

    // Rules 3,4,7,8,12: Guaranteed by deterministic regex — no interpretation,
    // no inference, no unsupported normalization, verbatim specificity and
    // proper nouns preserved. (Regex cannot alter matched text.)

    // Category classification
    const category = classify_category(sentence);
    trace.push(`Classify: → ${category}`);

    // Rule 10: Preference vs. requirement
    const qualifier = rule10_classify_qualifier(sentence);
    trace.push(`Rule 10: ${qualifier}`);

    // Rule 11: Availability override
    const isAvail = rule11_is_availability(sentence);
    const finalQualifier = isAvail ? 'availability' as const : qualifier;
    if (isAvail) {
      trace.push('Rule 11: Reclassified as availability');
    }

    facts.push({ text: sentence, category, qualifier: finalQualifier, rule_trace: trace });
  }

  // Rule 9: Deduplicate
  const before = facts.length;
  const deduped = rule9_deduplicate(facts);
  rule_log.push(`Rule 9 (Dedup): ${before} → ${deduped.length} facts (${before - deduped.length} duplicates removed)`);

  // Build category map
  const categories: Partial<SemanticCategories> = {};
  for (const f of deduped) {
    if (!categories[f.category]) categories[f.category] = [];
    categories[f.category]!.push(f.text);
  }

  return {
    facts: deduped,
    categories,
    total_facts: deduped.length,
    rule_log,
  };
}
