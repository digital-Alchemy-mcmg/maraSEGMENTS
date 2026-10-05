from __future__ import annotations

import copy
from typing import Any, Dict, List


class CandidateVault:
    """Read-only in-memory container for operator-mounted candidate Spatial DNA.

    Candidate atoms are quarantined from A/B/B1/B2. B3 and B4 may read atoms.
    Stage B never persists candidate data and unmounts the vault after the B-cycle.
    """

    def __init__(self, raw_yaml: str, parsed_data: Dict[str, Any], content_hash: str):
        self._raw_yaml = raw_yaml
        self._data = parsed_data
        self._content_hash = content_hash
        self._candidate_id = parsed_data["candidate"]["candidate_id"]
        self._full_name = parsed_data["candidate"]["full_name"]
        self._is_mounted = True

    @property
    def is_mounted(self) -> bool:
        return self._is_mounted

    @property
    def candidate_id(self) -> str:
        self._assert_mounted()
        return self._candidate_id

    @property
    def full_name(self) -> str:
        self._assert_mounted()
        return self._full_name

    @property
    def content_hash(self) -> str:
        return self._content_hash

    def get_domain_atoms(self, domain_name: str, requesting_stage: str) -> List[Dict[str, Any]]:
        self._assert_mounted()
        stage = requesting_stage.upper()
        if stage in {"A", "B", "B1", "B2"}:
            raise PermissionError(f"Quarantine violation: Stage {requesting_stage} cannot read candidate atoms.")
        domains = self._data.get("domains", {})
        return copy.deepcopy(domains.get(domain_name, {}).get("atoms", []))

    def get_candidate_identity(self, requesting_stage: str) -> Dict[str, Any]:
        self._assert_mounted()
        stage = requesting_stage.upper()
        if stage in {"A", "B", "B1", "B2"}:
            raise PermissionError(f"Quarantine violation: Stage {requesting_stage} cannot read candidate identity payload.")
        candidate = self._data.get("candidate")
        if not isinstance(candidate, dict):
            raise ValueError("Mounted SDNA is missing candidate identity.")
        return copy.deepcopy(candidate)

    def get_atom_index(self, requesting_stage: str) -> Dict[str, Dict[str, Any]]:
        self._assert_mounted()
        stage = requesting_stage.upper()
        if stage not in {"B3", "B4"}:
            raise PermissionError(f"Stage {requesting_stage} cannot request the candidate atom index.")
        index: Dict[str, Dict[str, Any]] = {}
        for domain_name, domain in self._data.get("domains", {}).items():
            for atom in domain.get("atoms", []):
                atom_id = atom.get("atom_id")
                if atom_id:
                    record = copy.deepcopy(atom)
                    record.setdefault("domain", domain_name)
                    index[atom_id] = record
        return index

    def unmount(self) -> None:
        self._data = {}
        self._raw_yaml = ""
        self._candidate_id = ""
        self._full_name = ""
        self._is_mounted = False

    def _assert_mounted(self) -> None:
        if not self._is_mounted:
            raise RuntimeError("CandidateVault is unmounted. Access is prohibited.")
