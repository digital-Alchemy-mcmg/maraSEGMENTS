# Spatial DNA Pipeline — Segment B Harness

This branch contains the isolated Stage B execution harness: B1 → B2 → B3 → B4 → B5 → T06 → sidecar termination → C1 handoff.

## Runtime ingress

There are no embedded candidates, targets, automatic fixtures, or fallback values. Runtime requires exactly three operator-supplied inputs:

1. Stage A traveling envelope JSON.
2. Stage A stationary sidecar JSON.
3. Candidate SDNA YAML selected by the operator.

CLI:

```bash
python run_stage_b.py --envelope /path/stage_a_envelope.json --sidecar /path/stage_a_sidecar.json --candidate /path/candidate.sdna.yaml --output /path/stage_b_handoff.json
```

Browser/Codespaces test surface:

```bash
python dev_server.py
```

Open forwarded port 8000 and paste the same three authoritative inputs.

## Ownership boundaries

- B1 reads target source and creates temporary target tags only.
- B2 reads B1 tags and freezes the competency tree.
- B3 has no sidecar parameter; it can read only the frozen B2 tree and CandidateVault.
- B4 independently verifies B3-bound atom IDs/content against CandidateVault, records evidence ceilings and source trace, then purges temporary tags.
- B5 sees only B4/B2 semantic state. It does not read candidate SDNA or sidecar and does not set page count, density, typography, or résumé layout.
- T06 independently recomputes the source hash and verifies B5 → B4 → B3 → B2 lineage plus source spans where exact spans exist.
- CandidateVault is unmounted after the B-cycle.
- Sidecar termination proves application-level reference unreachability only. Python does not provide a verifiable guarantee of physical/kernel memory zeroization, so the receipt does not make that claim.

## Tests

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
```

Tests generate ephemeral values inside the test process; none are selectable by runtime execution.

## Audit provenance

Audit lane: **GPT**. This branch is the GPT-audited Stage B baseline and is intentionally isolated from Jules' parallel work.

## Canonical SDNA contract

Spatial DNA is **YAML only** across the pipeline. Segment A is the real raw-SDNA ingress. Segment B asks for the same YAML only because this branch is a standalone execution test; that input simulates the already-mounted candidate vault that the compiled A→B pipeline will carry forward. Segment B does not define a JSON SDNA format. Segment C never reopens SDNA and consumes only the sealed Stage B handoff.
