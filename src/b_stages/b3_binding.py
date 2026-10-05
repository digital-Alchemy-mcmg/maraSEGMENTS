import re
from typing import Dict, Any
from ..sdna.candidate_vault import CandidateVault
from ..envelope.master_envelope import MissingEnvelopeInputError


class B3EvidenceBinder:
    """B3 binds candidate atoms to the frozen B2 tree. B-Sidecar is not in this interface."""

    @staticmethod
    def _tokens(text: str) -> set[str]:
        return {t for t in re.findall(r"[a-z0-9+#.-]+", (text or "").casefold()) if len(t) > 3}

    @staticmethod
    def execute(b2_tree: Dict[str, Any], vault: CandidateVault) -> Dict[str, Any]:
        nodes = b2_tree.get("nodes")
        if not nodes:
            raise MissingEnvelopeInputError("B_sdna.competency_tree.nodes", "B3_BINDING", "No nodes in competency tree.")
        atom_index = vault.get_atom_index("B3")
        bindings: Dict[str, Any] = {}
        for node_id, node in nodes.items():
            req_tokens = B3EvidenceBinder._tokens(node.get("label", ""))
            best = None
            best_score = 0.0
            for atom_id, atom in atom_index.items():
                atom_tokens = B3EvidenceBinder._tokens(atom.get("content", ""))
                overlap = req_tokens & atom_tokens
                score = len(overlap) / len(req_tokens) if req_tokens else 0.0
                if score > best_score:
                    best_score = score
                    best = (atom_id, atom)
            if best is not None and best_score > 0:
                atom_id, atom = best
                bindings[node_id] = {
                    "node_id": node_id,
                    "bound_atom_id": atom_id,
                    "atom_content": atom.get("content"),
                    "domain": atom.get("domain"),
                    "binding_score": round(best_score, 6),
                    "status": "BOUND",
                }
            else:
                bindings[node_id] = {
                    "node_id": node_id, "bound_atom_id": None, "atom_content": None,
                    "domain": None, "binding_score": 0.0, "status": "UNBOUND",
                }
        return {
            "bindings": bindings,
            "total_nodes": len(nodes),
            "bound_count": sum(1 for b in bindings.values() if b["status"] == "BOUND"),
        }
