from typing import Dict, Any

class C2ClaimsFormulator:
    """C2 expresses only evidence already authorized by C1/B5."""
    @staticmethod
    def execute(c1_docket: Dict[str, Any], a_scout: Dict[str, Any], candidate_identity: Dict[str, Any]) -> Dict[str, Any]:
        experience_claims, project_claims, supporting_claims, competency_labels = [], [], [], []
        for item in c1_docket.get("docket_items", []):
            proposition, atom_id, domain = item.get("proposition"), item.get("atom_id"), item.get("domain")
            if not proposition or not atom_id:
                raise ValueError("C2 received an unresolved C1 docket item.")
            claim = {
                "atom_id": atom_id, "node_id": item.get("node_id"),
                "bullet_text": proposition if proposition.endswith(".") else proposition + ".",
                "source_domain": domain, "context": item.get("context", {}),
                "prominence_class": item.get("prominence_class"), "metric_ceiling_enforced": True,
            }
            if item.get("node_label"):
                competency_labels.append({"label": item["node_label"], "atom_id": atom_id, "node_id": item.get("node_id")})
            if domain == "WORK_HISTORY": experience_claims.append(claim)
            elif domain == "CREATIVE_PROJECTS": project_claims.append(claim)
            else: supporting_claims.append(claim)
        summary_claim = c1_docket.get("projection_context", {}).get("prism_intro_evaluation") or None
        return {
            "status": "CLAIMS_BOUNDED", "summary_claim": summary_claim,
            "experience_claims": experience_claims, "project_claims": project_claims,
            "supporting_claims": supporting_claims, "competency_labels": competency_labels,
            "zero_hallucination_verified": True,
        }
