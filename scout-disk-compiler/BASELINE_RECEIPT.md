# Scout Disk Compiler — Curated Taxonomy Baseline

Branch purpose: preserve the tested Amazon Quick Scout Disk Compiler state that adds a curated NAICS/SOC knowledgebase and searchable typeahead resolver in the Disk Builder.

Source artifact:
`PARACHUTE_scout-disk-compiler_2026-10-05_12-55-12-856.zip`

Archive SHA-256:
`ec638c925b36cf6fa4d1a1c4c303c287b88047dc1384f4d1d536c26cd928b6ea`

## Curated knowledgebase change

- Added `webapp/src/components/taxonomy-data.ts`
  - 92 deduplicated NAICS entries.
  - 109 deduplicated SOC entries.
  - NAICS search fields: code, title, sector, keywords.
  - SOC search fields: code, title, broadCategory.
  - Results capped at 12.
- Replaced `webapp/src/components/DiskBuilder.tsx`
  - Searchable NAICS and SOC typeaheads.
  - Canonical code/title auto-population.
  - Duplicate prevention.
  - Manual entry retained as fallback.

## Verified source hashes

- `webapp/src/components/taxonomy-data.ts`
  - `f5a558885de81c9867a7c15173fff656ad1a25a23037aa866a10d2613225dd59`
- `webapp/src/components/DiskBuilder.tsx`
  - `2e0af211724e4f7949261692a7bbffb0f05e99eb145e2de8bfc09446dc014f56`

## Status

This branch is the frozen curated-taxonomy baseline. Do not merge automatically. Jules can use it as the authoritative handoff point for the next work pass.
