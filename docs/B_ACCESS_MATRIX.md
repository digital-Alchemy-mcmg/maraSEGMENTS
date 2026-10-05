# Segment B Access Matrix

| Stage | A taxonomy | Sidecar raw source | CandidateVault | B2 tree | B4 ledger |
|---|---:|---:|---:|---:|---:|
| Ingress | yes | yes | mounted | no | no |
| B1 | yes | yes | no | no | no |
| B2 | yes | tag trace only | no | creates | no |
| B3 | no | no | yes | yes | no |
| B4 | target trace | verifier-controlled | yes | yes | creates |
| B5 | no | no | no | yes | yes |
| T06 | lineage | verifier-controlled | no | yes | yes |
| C | no | no | no | sealed semantic state | sealed semantic state |

Post-termination CandidateVault access must fail.
