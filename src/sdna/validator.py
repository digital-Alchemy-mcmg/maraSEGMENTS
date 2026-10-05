from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import yaml


REQUIRED_DOMAINS = [
    "IDENTITY",
    "WORK_HISTORY",
    "EDUCATION_TECH",
    "CREATIVE_PROJECTS",
    "COGNITIVE_PROFILE",
    "TESTIMONY_REFERENCES",
]

SUPPORTED_SCHEMA_VERSIONS = ["0.2.0", "1.0.0", "2.0.0"]


@dataclass(frozen=True)
class ValidationStepResult:
    step_name: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class SDNAValidationReport:
    is_valid: bool
    candidate_id: Optional[str]
    full_name: Optional[str]
    schema_version: Optional[str]
    content_sha256: str
    steps: List[ValidationStepResult]
    errors: List[str]


class SDNAValidator:
    """Deterministic validator implementing the 10 SDNA acceptance gates."""

    @staticmethod
    def parse_yaml(raw_text: str) -> Dict[str, Any]:
        try:
            parsed = yaml.safe_load(raw_text)
            if not isinstance(parsed, dict):
                raise ValueError("Parsed YAML root is not a mapping object.")
            return parsed
        except Exception as e:
            raise ValueError(f"YAML parsing failure: {str(e)}") from e

    @classmethod
    def validate(cls, raw_text: str) -> Tuple[bool, Optional[Dict[str, Any]], SDNAValidationReport]:
        steps: List[ValidationStepResult] = []
        errors: List[str] = []
        content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
        try:
            data = cls.parse_yaml(raw_text)
        except Exception as e:
            err = f"Malformed YAML structure: {str(e)}"
            return False, None, SDNAValidationReport(False, None, None, None, content_hash, [ValidationStepResult("yaml_syntax", False, err)], [err])

        ver = str(data.get("schema_version", "")).strip()
        if ver in SUPPORTED_SCHEMA_VERSIONS:
            steps.append(ValidationStepResult("envelope/schema version", True, f"Version {ver} supported"))
        else:
            err = f"Unsupported schema version: '{ver}'. Allowed: {SUPPORTED_SCHEMA_VERSIONS}"
            steps.append(ValidationStepResult("envelope/schema version", False, err)); errors.append(err)

        cand = data.get("candidate"); cand_id = None; cand_name = None
        if isinstance(cand, dict) and cand.get("candidate_id") and cand.get("full_name"):
            cand_id = str(cand["candidate_id"]).strip(); cand_name = str(cand["full_name"]).strip()
            steps.append(ValidationStepResult("candidate identity", True, f"Identified: {cand_name} ({cand_id})"))
        else:
            err = "Candidate identity missing required fields ('candidate_id', 'full_name')"
            steps.append(ValidationStepResult("candidate identity", False, err)); errors.append(err)

        sources = data.get("source_registry")
        if isinstance(sources, list) and sources and all(isinstance(s, dict) and "source_id" in s and "hash" in s for s in sources):
            steps.append(ValidationStepResult("source registry", True, f"{len(sources)} sources registered"))
        else:
            err = "Source registry is missing, empty, malformed, or contains items without source_id/hash"
            steps.append(ValidationStepResult("source registry", False, err)); errors.append(err)

        domains = data.get("domains"); atom_ids=set(); duplicates=set(); atom_count=0
        if isinstance(domains, dict):
            for d_val in domains.values():
                if isinstance(d_val, dict) and isinstance(d_val.get("atoms"), list):
                    for atom in d_val["atoms"]:
                        if isinstance(atom, dict) and "atom_id" in atom:
                            aid=str(atom["atom_id"]).strip(); atom_count+=1
                            if aid in atom_ids: duplicates.add(aid)
                            atom_ids.add(aid)
        if atom_count > 0 and not duplicates:
            steps.append(ValidationStepResult("evidence atoms", True, f"{atom_count} unique atom IDs verified"))
        else:
            err = "Evidence atoms invalid: duplicate IDs or zero evidence atoms"
            steps.append(ValidationStepResult("evidence atoms", False, err)); errors.append(err)

        provenance_ok=True
        if isinstance(domains, dict):
            for d_val in domains.values():
                if isinstance(d_val, dict) and isinstance(d_val.get("atoms"), list):
                    for atom in d_val["atoms"]:
                        if not isinstance(atom, dict) or not atom.get("source_pointer") or not atom.get("evidence_provenance"):
                            provenance_ok=False
        if provenance_ok and atom_count>0:
            steps.append(ValidationStepResult("provenance", True, "Source pointers and evidence provenance verified"))
        else:
            err="One or more atoms lack required source_pointer or evidence_provenance"
            steps.append(ValidationStepResult("provenance", False, err)); errors.append(err)

        if isinstance(domains, dict) and sorted(domains.keys()) == sorted(REQUIRED_DOMAINS):
            steps.append(ValidationStepResult("six domain ownership", True, "Exactly the 6 closed domains present"))
        else:
            err="Domain mismatch. Must be exactly the 6 required domains."
            steps.append(ValidationStepResult("six domain ownership", False, err)); errors.append(err)

        chronology=data.get("chronology")
        if isinstance(chronology, dict) and "events" in chronology:
            steps.append(ValidationStepResult("chronology/state", True, "Chronology structures verified"))
        else:
            err="Chronology section missing or lacking events array"
            steps.append(ValidationStepResult("chronology/state", False, err)); errors.append(err)

        conflicts=data.get("conflicts")
        if isinstance(conflicts, dict) and ("unresolved" in conflicts or "resolved" in conflicts):
            steps.append(ValidationStepResult("conflict structures", True, "Conflict manifests present"))
        else:
            err="Conflict section missing or malformed"
            steps.append(ValidationStepResult("conflict structures", False, err)); errors.append(err)

        relationships=data.get("relationships")
        if isinstance(relationships, list) and all(isinstance(r, dict) and "from_atom_id" in r and "to_atom_id" in r for r in relationships):
            steps.append(ValidationStepResult("relationship/edge structures", True, f"{len(relationships)} edges verified"))
        else:
            err="Relationships array missing or malformed"
            steps.append(ValidationStepResult("relationship/edge structures", False, err)); errors.append(err)

        integrity=data.get("integrity")
        declared_hash=integrity.get("content_sha256") if isinstance(integrity, dict) else None
        if declared_hash:
            canonical_obj=json.loads(json.dumps(data))
            canonical_integrity=canonical_obj.get("integrity") or {}
            canonical_integrity.pop("content_sha256", None)
            canonical_obj["integrity"]=canonical_integrity
            canonical=json.dumps(canonical_obj, sort_keys=True, separators=(",", ":"))
            computed=hashlib.sha256(canonical.encode("utf-8")).hexdigest()
            if str(declared_hash).lower()==computed:
                steps.append(ValidationStepResult("integrity hash", True, f"Canonical SDNA hash verified: {computed[:12]}..."))
            else:
                err=f"Integrity hash mismatch: declared {str(declared_hash)[:12]}..., computed {computed[:12]}..."
                steps.append(ValidationStepResult("integrity hash", False, err)); errors.append(err)
        else:
            err="Integrity block missing or missing content_sha256"
            steps.append(ValidationStepResult("integrity hash", False, err)); errors.append(err)

        valid=not errors
        report=SDNAValidationReport(valid,cand_id,cand_name,ver,content_hash,steps,errors)
        return valid,(data if valid else None),report
