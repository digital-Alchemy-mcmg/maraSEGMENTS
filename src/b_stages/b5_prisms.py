from typing import Dict, Any
from ..envelope.master_envelope import MissingEnvelopeInputError


class B5FivePrismEngine:
    """B5 ranks recruitment prisms from verified B4 evidence and emits semantic handoff state.

    B5 does not choose page count, density, typography, or résumé layout. Those belong to C.
    """

    @staticmethod
    def execute(b4_ledger: Dict[str, Any], b2_tree: Dict[str, Any], target_job_title: str) -> Dict[str, Any]:
        match_pct = b4_ledger.get("intake_match_percentage")
        if match_pct is None:
            raise MissingEnvelopeInputError("b4_ledger.intake_match_percentage", "B5_PRISMS")
        admitted = b4_ledger.get("admitted_bindings")
        if not admitted:
            raise MissingEnvelopeInputError("b4_ledger.admitted_bindings", "B5_PRISMS", "Admitted bindings empty.")
        passed = [b for b in admitted if b.get("disposition") == "PASS"]
        nodes = b2_tree.get("nodes", {})
        if not passed:
            prism_distribution = {name: {"score": 0.0} for name in (
                "Independent Staffing-Firm Owner", "Sports Agent", "Discovery Scout", "Sales Headhunter", "Casting Director")}
        else:
            hard_pass = sum(1 for b in passed if nodes.get(b.get("node_id"), {}).get("classification") == "HARD_CORE")
            soft_pass = sum(1 for b in passed if nodes.get(b.get("node_id"), {}).get("classification") == "ORGANIZATIONAL")
            domains = {b.get("domain") for b in passed if b.get("domain")}
            mean_binding = sum(float(b.get("binding_score", 0.0)) for b in passed) / len(passed)
            coverage = float(match_pct)
            hard_ratio = hard_pass / max(1, sum(1 for n in nodes.values() if n.get("classification") == "HARD_CORE"))
            soft_ratio = soft_pass / max(1, sum(1 for n in nodes.values() if n.get("classification") == "ORGANIZATIONAL"))
            diversity = min(1.0, len(domains) / 4.0)
            prism_distribution = {
                "Independent Staffing-Firm Owner": {"score": round(coverage, 1)},
                "Sports Agent": {"score": round(100 * mean_binding, 1)},
                "Discovery Scout": {"score": round(100 * diversity, 1)},
                "Sales Headhunter": {"score": round(100 * soft_ratio, 1)},
                "Casting Director": {"score": round(100 * hard_ratio, 1)},
            }
        ranked = sorted(({"name": n, "score": v["score"]} for n, v in prism_distribution.items()), key=lambda x: x["score"], reverse=True)
        owner = ranked[0]["name"]
        propositions, foreground, reinforcement, background, suppression, unresolved, allowed = [], [], [], [], [], [], []
        for idx, binding in enumerate(admitted, 1):
            node_id = binding.get("node_id")
            node = nodes.get(node_id, {})
            disposition = binding.get("disposition", "UNRESOLVED")
            prop_id = f"prop-{idx:03d}"
            if disposition == "PASS":
                if node.get("weight") == "CRITICAL_STAR":
                    prominence = "FOREGROUND"; foreground.append(prop_id)
                elif node.get("weight") == "STRONG_TILDE":
                    prominence = "REINFORCEMENT"; reinforcement.append(prop_id)
                else:
                    prominence = "BACKGROUND"; background.append(prop_id)
                statement = binding.get("proposition")
                if statement: allowed.append(statement)
                ceiling = "SUPPORTED_FACTUAL"
            else:
                prominence = "SUPPRESSED"; suppression.append(prop_id); ceiling = "NONE"
                unresolved.append({"node_id": node_id, "target_requirement": node.get("label"), "status": "EVIDENCE_GAP_MUST_NOT_FABRICATE"})
            propositions.append({
                "proposition_id": prop_id,
                "originating_b4_node": node_id,
                "target_address": node.get("address"),
                "target_requirement": node.get("label"),
                "target_weight": node.get("weight"),
                "atom_id": binding.get("atom_id"),
                "domain": binding.get("domain"),
                "statement": binding.get("proposition"),
                "evidence_ceiling": ceiling,
                "disposition": disposition,
                "prominence_class": prominence,
                "target_trace": binding.get("target_trace"),
                "lineage": {"B2_node": node_id, "B3_atom": binding.get("atom_id"), "B4_disposition": disposition, "B5_prominence": prominence},
            })
        return {
            "owner_prism": owner,
            "ranked_prisms": ranked,
            "prism_distribution": prism_distribution,
            "prism_intro_evaluation": {"target_job_title": target_job_title, "verified_requirement_coverage_pct": match_pct, "owner_prism": owner},
            "projection_posture": "EVIDENCE_BOUNDED",
            "verified_candidate_propositions": propositions,
            "semantic_priorities": {"foreground": foreground, "reinforcement": reinforcement, "background": background, "suppression": suppression},
            "prominence_classes": {"foreground_count": len(foreground), "reinforcement_count": len(reinforcement), "background_count": len(background), "suppression_count": len(suppression)},
            "writing_boundaries": {
                "assertiveness_ceiling": "SUPPORTED_FACTUAL",
                "allowed_assertions": [a for a in allowed if a],
                "prohibited_implications": ["No assertion may exceed its cited candidate atom or convert an unresolved requirement into candidate evidence."],
            },
            "ordering_guidance": foreground + reinforcement + background,
            "unresolved_gaps": unresolved,
            "geometric_directives": {"lead_with": (foreground + reinforcement + background)[0] if (foreground + reinforcement + background) else None},
            "enhancement_metrics": {"intake_match_percentage": match_pct},
        }
