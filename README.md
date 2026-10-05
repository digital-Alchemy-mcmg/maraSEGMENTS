# Segment A — Standalone YAML-First Execution Test

`segment/A` is the isolated Codespaces test branch for Segment A (A0–A11).

Segment A now accepts the canonical SDNA **YAML directly** at A1. There is no production JSON wrapper, no built-in candidate, and no fabricated prominence value.

A1 parses operator-supplied YAML. A2 validates the SDNA structure and recomputes its manifest hash before A3 will accept compiler/target input.

If the canonical SDNA does not contain a prominence reference, Segment A records `ABSENT_IN_CANONICAL_SDNA`; it does not manufacture one.

## Codespaces

Create a Codespace on `segment/A`. The devcontainer automatically:

1. unpacks `STAGE_A_YAML_FIRST.zip`;
2. installs PyYAML;
3. runs the six Segment A contract tests.

Expected: **6/6 PASS**.

Then run:

```bash
python3 dev_server.py
```

Open forwarded port `8000`.

- Left: **A1 — Canonical SDNA YAML**
- Right: **A3 — Compiler / Target Package JSON**
- Execute: **A0 → A11**

Success: `SEALED_A`
Failure: `HALTED_A`

The YAML-first runtime was locally verified against the supplied `CF-SDNA-EVERYTHING-1.0` document: candidate `CHRISTOPHER-FLOURNOY-001`, 132 evidence atoms, no prominence reference fabricated, and a valid compiler package reached `SEALED_A`.
