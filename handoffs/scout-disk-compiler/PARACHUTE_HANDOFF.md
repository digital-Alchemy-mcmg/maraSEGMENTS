# Scout Disk Compiler — Parachute Handoff

Source snapshot: `PARACHUTE_scout-disk-compiler_2026-10-05_12-38-46-335.zip`

Archive SHA-256:

`413761abb4ccf0d6e406d2e270325a72e2dd8e1eacdc132ca4305756cc065f7c`

## Status

The Parachute implementation is operational in Amazon Quick and can be invoked from the application UI. The current archive verifies internally, but three fixes remain before it should be treated as the frozen recovery baseline.

## Required fixes

1. Include `webapp/src/parachute/parachute-browser.ts` in every Parachute archive.
   - `App.tsx` imports this module.
   - The current archive does not contain it.

2. Normalize archive paths.
   - Current archive contains:
     - `../.gitignore`
     - `../README.md`
     - `../package.json`
   - Archive entries must be repository-relative and must not contain `..`.

3. Include `package-lock.json` when present.
   - It is currently excluded as reconstructable.
   - Recovery artifacts should preserve the exact dependency lock.

## Acceptance tests to add

- Fail if any runtime-imported Parachute source file is absent from the archive.
- Fail if any archive entry contains `..`.
- Fail if `package-lock.json` exists in the project but is omitted from the archive.
- Recompute every manifest SHA-256 against archived bytes.
- Confirm Parachute remains outside the normal compiler/build execution path.

## Constraints

Do not refactor or modify compiler, validator, ENVOY, decomposition, or pipeline behavior while correcting Parachute.

This branch is a handoff branch only. Do not merge until the corrected Parachute archive is regenerated and verified.
