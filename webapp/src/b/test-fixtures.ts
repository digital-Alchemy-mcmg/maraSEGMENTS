// ============================================================
// Test Fixtures — NON-PRODUCTION deterministic test data
// ============================================================
// WARNING: These fixtures are for TEST HARNESS use ONLY.
// They must NEVER auto-load or replace production ingress.

export const FIXTURE_ENVELOPE = {
  Z_state: {
    run_id: 'test-run-001',
    candidate_id: 'candidate-alpha',
    target_id: 'target-senior-engineer',
    pipeline_version: '1.0.0',
    sdna_manifest_sha256: '', // Will be computed at test time
    current_stage: 'A_COMPLETE',
    status: 'complete:HANDOFF_TO_B',
  },
  A_scout: {
    target_entity: {
      company_name: 'TechCorp Infrastructure',
      job_title: 'Senior Software Engineer',
    },
    requirements_taxonomy: {
      hard_requirements: [
        'distributed systems experience',
        'Python programming proficiency',
        'cloud infrastructure management',
      ],
      soft_requirements: [
        'team leadership and mentorship',
        'agile methodology experience',
      ],
      keyword_lexicon: [
        'microservices', 'AWS', 'Kubernetes', 'Scrum',
      ],
    },
    original_content_sha256: '', // Will be computed at test time
    source_url: 'https://example.com/job/senior-engineer',
  },
  history: [
    { event: 'A_INITIALIZED', timestamp: '2026-09-01T00:00:00Z' },
    { event: 'A_SCOUT_COMPLETE', timestamp: '2026-09-01T00:05:00Z' },
  ],
  audit_trail: ['A stage completed successfully'],
};

export const FIXTURE_RAW_POSTING = `Senior Software Engineer — Distributed Systems

We are seeking a Senior Software Engineer with deep distributed systems experience 
to join our infrastructure team. The ideal candidate will have:

Requirements:
- Extensive distributed systems experience including microservices architecture
- Strong Python programming proficiency for backend services
- Cloud infrastructure management with AWS or equivalent platforms
- Experience with container orchestration and Kubernetes

Preferred Qualifications:
- Team leadership and mentorship of junior engineers
- Agile methodology experience with Scrum or Kanban
- Experience with real-time data processing pipelines
- Strong communication and documentation skills

The role involves designing and implementing scalable distributed systems, 
managing cloud infrastructure, and mentoring team members. You will work 
closely with product and data teams using agile methodology to deliver 
high-impact features.`;

export const FIXTURE_SIDECAR = {
  run_binding: {
    run_id: 'test-run-001',
    target_id: 'target-senior-engineer',
  },
  raw_posting: FIXTURE_RAW_POSTING,
  raw_html: '<div>' + FIXTURE_RAW_POSTING + '</div>',
  original_content_sha256: '', // Will be computed at test time
};

export const FIXTURE_CANDIDATE_YAML = `candidate_id: candidate-alpha
manifest_version: "1.0"
atoms:
  - atom_id: atom-work-001
    content: "Designed and operated large-scale distributed systems serving 50M requests per day using microservices architecture and event-driven patterns"
    domain: WORK_HISTORY
  - atom_id: atom-work-002
    content: "Led Python backend development team of 8 engineers building high-performance API services with FastAPI and asyncio"
    domain: WORK_HISTORY
  - atom_id: atom-work-003
    content: "Managed cloud infrastructure on AWS including ECS, Lambda, and DynamoDB with infrastructure-as-code using Terraform"
    domain: WORK_HISTORY
  - atom_id: atom-skill-001
    content: "Expert in Python programming with 10 years of experience in backend systems, data pipelines, and automation"
    domain: SKILLS
  - atom_id: atom-lead-001
    content: "Mentored 12 junior and mid-level engineers over 4 years through structured coaching programs and code review processes"
    domain: LEADERSHIP
  - atom_id: atom-lead-002
    content: "Practiced agile methodology including Scrum master role for cross-functional team of 15 members delivering bi-weekly sprints"
    domain: LEADERSHIP
  - atom_id: atom-edu-001
    content: "M.S. Computer Science with thesis on distributed consensus algorithms"
    domain: EDUCATION
`;

// Compute hashes at test time
export async function prepareFixtures(): Promise<{
  envelope: typeof FIXTURE_ENVELOPE;
  sidecar: typeof FIXTURE_SIDECAR;
  candidateYaml: string;
}> {
  const encoder = new TextEncoder();

  // Hash raw posting
  const postingHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(FIXTURE_RAW_POSTING)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const sidecar = { ...FIXTURE_SIDECAR, original_content_sha256: postingHash };

  // Parse and canonicalize SDNA for manifest hash
  const { canonicalizeSDNA, parseSDNAYaml } = await import('./authority/canonical-sdna');
  const sdna = parseSDNAYaml(FIXTURE_CANDIDATE_YAML);
  const manifestHash = await canonicalizeSDNA(sdna);

  const envelope = {
    ...FIXTURE_ENVELOPE,
    Z_state: { ...FIXTURE_ENVELOPE.Z_state, sdna_manifest_sha256: manifestHash },
    A_scout: { ...FIXTURE_ENVELOPE.A_scout, original_content_sha256: postingHash },
  };

  return { envelope, sidecar, candidateYaml: FIXTURE_CANDIDATE_YAML };
}
