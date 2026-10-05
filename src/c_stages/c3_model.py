from typing import Dict, Any

class C3DocumentModeler:
    """C3 projects C2 content into document structure without creating candidate content."""
    @staticmethod
    def execute(c2_claims: Dict[str, Any], candidate_identity: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(candidate_identity, dict) or not candidate_identity.get("full_name"):
            raise ValueError("C3 requires candidate_identity.full_name from the Stage B handoff.")
        contact = candidate_identity.get("primary_contact", {}) or {}
        sections = []
        if c2_claims.get("summary_claim"):
            sections.append({"section_id":"sec-summary","title":"Summary","type":"PARAGRAPH","content":c2_claims["summary_claim"]})
        labels = c2_claims.get("competency_labels", [])
        if labels:
            sections.append({"section_id":"sec-competencies","title":"Competencies","type":"EVIDENCE_LABELS","items":labels})
        grouped, group_index = [], {}
        for claim in c2_claims.get("experience_claims", []):
            ctx = claim.get("context", {}) or {}
            key = (ctx.get("company"), ctx.get("role"), ctx.get("dates"), ctx.get("location"))
            if not any(key): key = (claim.get("atom_id"), None, None, None)
            if key not in group_index:
                group_index[key] = len(grouped)
                grouped.append({"role":ctx.get("role"),"company":ctx.get("company"),"dates":ctx.get("dates"),"location":ctx.get("location"),"bullets":[],"atom_ids":[]})
            g = grouped[group_index[key]]
            g["bullets"].append(claim["bullet_text"]); g["atom_ids"].append(claim["atom_id"])
        if grouped:
            sections.append({"section_id":"sec-experience","title":"Experience","type":"TIMELINE","items":grouped})
        projects = []
        for claim in c2_claims.get("project_claims", []):
            ctx = claim.get("context", {}) or {}
            projects.append({"title":ctx.get("project"),"year":ctx.get("year"),"details":claim.get("bullet_text"),"atom_id":claim.get("atom_id")})
        if projects:
            sections.append({"section_id":"sec-projects","title":"Projects","type":"PROJECTS","items":projects})
        supporting = c2_claims.get("supporting_claims", [])
        if supporting:
            sections.append({"section_id":"sec-supporting","title":"Supporting Evidence","type":"CLAIMS","items":supporting})
        education = candidate_identity.get("education")
        if education:
            sections.append({"section_id":"sec-education","title":"Education","type":"CREDENTIALS","items":education})
        ast_root = {"document_type":"ATS_PROFESSIONAL_RESUME","header":{
            "full_name":candidate_identity["full_name"],"email":contact.get("email"),
            "location":contact.get("location"),"links":contact.get("links",[])
        },"sections":sections}
        return {"status":"AST_SYNTHESIZED","section_count":len(sections),"ast_root":ast_root}
