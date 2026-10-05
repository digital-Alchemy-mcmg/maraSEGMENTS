# Segment A — Standalone Execution Test

This branch is the isolated execution-test branch for Segment A (Scout & Ingress).

## What happens in Codespaces

The branch contains the supplied `STAGE_A_HARNESS.zip` plus a Codespaces bootstrap.

When the Codespace is created, the bootstrap:
1. extracts the supplied Stage A package;
2. preserves the A0–A11 engine;
3. removes the broken dependency on nonexistent sample JSON fixtures;
4. installs a self-contained 5-test contract suite;
5. adds a manual browser ingress where you paste the canonical SDNA JSON yourself;
6. adds a second ingress for the Disk/Compiler package;
7. leaves Segment A fail-closed: `SEALED_A` or `HALTED_A`.

## Run the tests

```bash
python3 -m unittest discover -s tests -v
```

Expected: **5/5 PASS**.

## Run the manual SDNA test surface

```bash
python3 dev_server.py
```

Open forwarded port **8000**.

The first box is **A1 — Canonical SDNA Package JSON**. Paste your SDNA there. The second box is the compiler/target package. Execution does not proceed to target intake unless SDNA verification passes.

## CLI

```bash
python3 run_stage_a.py --sdna-package /path/to/sdna.json --compiler-package /path/to/compiler.json
```

## Vercel

The unpacked test surface includes `index.html`, `api/segment_a.py`, and `vercel.json`, so the same manual-entry test can be used as a Vercel preview after the package is unpacked. Treat Vercel as a disposable execution surface; GitHub `segment/A` remains the source-of-truth test branch.
