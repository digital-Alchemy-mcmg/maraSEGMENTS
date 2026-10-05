from typing import Dict, Any

class C1DocketSynthesizer:
    """C1 resolves the verified B5 projection into a finite, traceable evidence docket."""
    @staticmethod
    def execute(b_sdna: Dict[str, Any], a_scout: Dict[str, Any]) -> Dict[str, Any]:
        attestation = b_sdna.get("B_sidecar_attestation")
        if not attestation or attestation.get("status") != "TERMINATED_AND_VERIFIED":
            raise PermissionError("C1 Handoff Blocked: B-Sidecar destruction attestation missing or unverified.")
        b4_ledger = b_sdna.get("b4_ledger")
        b5_projection = b_sdna.get("b5_projection")
        competency_tree = b_sdna.get("competency_tree")
        if not isinstance(b4_ledger, dict) or not isinstance(b5_projection, dict) or not isinstance(competency_tree, dict):
            raise ValueError("C1 requires competency_tree, b4_ledger, and b5_projection from Stage B.")
        admitted = b4_ledger.get("admitted_bindings")
        if not isinstance(admitted, list):
            raise ValueError("C1 requires b4_ledger.admitted_bindings as an array.")
        lead_directive = b5_projection.get("geometric_directives", {}).get("lead_with")
        nodes = competency_tree.get("nodes", {}) if isinstance(competency_tree.get("nodes", {}), dict) else {}
        docket_items = []
        for source_index, binding in enumerate(admitted):
            if binding.get("status") != "PASS":
                continue
            atom_id, node_id, proposition = binding.get("atom_id"), binding.get("node_id"), binding.get("proposition")
            if not atom_id or not node_id or not proposition:
                raise ValueError("C1 cannot admit a binding without node_id, atom_id, and proposition.")
            node = nodes.get(node_id, {})
            explicit_tokens = {str(node_id), str(atom_id), str(binding.get("domain", ""))}
            is_explicit_lead = bool(lead_directive) and str(lead_directive) in explicit_tokens
            docket_items.append({
                "node_id": node_id, "atom_id": atom_id, "domain": binding.get("domain"),
                "proposition": proposition, "context": binding.get("context", {}),
                "node_label": node.get("label"), "source_order": source_index,
                "prominence_class": "PRIMARY" if is_explicit_lead else "SUPPORTING",
            })
        docket_items.sort(key=lambda x: (x["prominence_class"] != "PRIMARY", x["source_order"]))
        return {
            "status": "DOCKET_FROZEN", "handoff_verified": True,
            "sidecar_tombstone_verified": attestation.get("sidecar_id"),
            "total_admitted_atoms": len(docket_items), "lead_directive": lead_directive,
            "projection_context": {
                "prism_intro_evaluation": b5_projection.get("prism_intro_evaluation"),
                "projection_posture": b5_projection.get("projection_posture"),
                "geometric_directives": b5_projection.get("geometric_directives", {}),
            },
            "docket_items": docket_items,
        }
