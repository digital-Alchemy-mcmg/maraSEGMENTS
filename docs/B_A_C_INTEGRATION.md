# A -> B -> C Integration Contract

Standalone and compiled modes differ only at adapters. Both produce the same BContext and execute the same B engine.

Compiled integration must preserve upstream sealed state rather than regenerate upstream authority. The existing legacy Python Segment B harness has a documented provenance limitation: load_input_data reconstructs MasterTravelingEnvelope state instead of preserving the exact immutable upstream envelope instance. This remains a known integration concern and is not silently treated as resolved by the Quick web harness.

C ingress is sealed-B-only and must reject raw SDNA, CandidateVault, sidecar, raw posting, raw HTML, and temporary tags.
