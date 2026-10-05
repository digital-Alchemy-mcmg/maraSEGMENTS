# Segment B Failure Model

Segment B fails closed.

Admission failures: missing/mismatched run_id, target_id, candidate_id, pipeline version, requirements taxonomy, SDNA authority, or target-source hash.
Access failures: B1/B2 candidate access, B3 sidecar/raw-source access, B5 sidecar/SDNA access, post-unmount vault access, or C raw-authority access.
Integrity failures: mutated B2 tree, altered/nonexistent B3/B4 atom lineage, candidate switch, broken source span, changed ledger hash, nonexistent B5 lineage node, or source-hash mismatch.

No stage silently repairs authority or lineage.
