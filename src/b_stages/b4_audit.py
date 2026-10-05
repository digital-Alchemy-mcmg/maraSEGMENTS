import hashlib
import json
from typing import Dict, Any
from ..sidecar.b_sidecar import BSidecar, SidecarStage
from ..sdna.candidate_vault import CandidateVault
from ..envelope.master_envelope import MissingEnvelopeInputError


class B4TruthAuditLedger:
    """B4 independently verifies B3 bindings against mounted SDNA and preserves target trace."""

    @staticmethod
    def execute(b3_bindings: Dict[str, Any], b2_tree: Dict[str, Any], sidecar: BSidecar,
                vault: CandidateVault, candidate_identity: Dict[str, Any]) -> Dict[str, Any]:
        bindings = b3_bindings.get("bindings")
        if not bindings:
            raise MissingEnvelopeInputError("B3_bindings.bindings", "B4_AUDIT", "No bindings provided to audit.")
        atom_index = vault.get_atom_index("B4")
        tags = sidecar.read_temporary_tags(SidecarStage.B4)
        nodes = b2_tree.get("nodes", {})
        admitted = []
        pass_count = 0
        for node_id, binding in bindings.items():
            atom_id = binding.get("bound_atom_id")
            source_atom = atom_index.get(atom_id) if atom_id else None
            exact_atom_match = bool(source_atom and source_atom.get("content") == binding.get("atom_content"))
            disposition = "PASS" if exact_atom_match else ("UNRESOLVED" if not atom_id else "REJECTED_INTEGRITY")
            if disposition == "PASS":
                pass_count += 1
            trace = nodes.get(node_id, {}).get("source_trace", {})
            tag = tags.get(trace.get("tag_id"), {}) if trace.get("tag_id") else {}
            admitted.append({
                "node_id": node_id,
                "atom_id": atom_id if disposition == "PASS" else None,
                "domain": source_atom.get("domain") if disposition == "PASS" else None,
                "disposition": disposition,
                "evidence_ceiling": "SUPPORTED_FACTUAL" if disposition == "PASS" else "NONE",
                "proposition": source_atom.get("content") if disposition == "PASS" else None,
                "binding_score": binding.get("binding_score", 0.0),
                "candidate_atom_integrity_verified": exact_atom_match,
                "target_trace": {
                    "tag_id": trace.get("tag_id"),
                    "source_match": tag.get("source_match", False),
                    "span_start": tag.get("span_start"),
                    "span_end": tag.get("span_end"),
                    "source_excerpt": tag.get("source_excerpt"),
                },
            })
        total = len(bindings)
        tag_layer_hash = sidecar.purge_temporary_tags()
        ledger = {
            "intake_match_percentage": round(pass_count / total * 100, 1) if total else 0.0,
            "admitted_bindings": admitted,
            "candidate_identity": candidate_identity,
            "disposition_counts": {
                "PASS": pass_count,
                "UNRESOLVED": sum(1 for x in admitted if x["disposition"] == "UNRESOLVED"),
                "REJECTED_INTEGRITY": sum(1 for x in admitted if x["disposition"] == "REJECTED_INTEGRITY"),
            },
            "tag_layer_purged": True,
            "tag_layer_sha256": tag_layer_hash,
        }
        canonical = json.dumps(ledger, sort_keys=True, separators=(",", ":"))
        ledger["ledger_sha256"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return ledger
