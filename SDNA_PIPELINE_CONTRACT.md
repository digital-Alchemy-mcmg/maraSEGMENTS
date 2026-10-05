# Canonical Spatial DNA Pipeline Ingress Contract

## One serialization

Canonical Spatial DNA is **YAML**.

There is no parallel production JSON representation of candidate Spatial DNA.

## Segment ownership

```text
Canonical SDNA YAML
        |
        v
SEGMENT A
  A1 parse YAML
  A2 validate/freeze identity + content hash
        |
        | traveling envelope carries SDNA identity/hash reference
        | candidate vault remains the SDNA authority
        v
SEGMENT B
  standalone test: operator supplies the SAME canonical YAML
  compiled pipeline: inherits the already-established SDNA vault/context
  B3/B4 are the candidate-evidence readers
        |
        v
SEALED B HANDOFF
        |
        v
SEGMENT C
  no raw SDNA ingress
  no YAML re-open
  no JSON SDNA
  consumes only sealed B semantic/provenance handoff
```

## Non-negotiable rules

1. A is the only normal pipeline ingress for raw candidate SDNA.
2. The canonical candidate SDNA serialization is YAML.
3. B's YAML field exists only for isolated standalone execution testing.
4. B must never invent or translate a second candidate representation.
5. C must never reopen candidate SDNA. It consumes the sealed B handoff.
6. A traveling envelope is an envelope instance, not the JSON Schema document.
7. The stationary sidecar is a separate A→B artifact containing authoritative target source material and run binding.
8. Schema files validate structures; they are never runtime payload substitutes.
