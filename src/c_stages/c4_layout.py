from typing import Dict, Any

class C4LayoutFitter:
    """C4 validates and assigns presentation geometry from the actual C3 AST."""
    @staticmethod
    def _estimated_lines(section: Dict[str, Any]) -> int:
        t = section.get("type")
        if t == "PARAGRAPH": return max(2, (len(section.get("content") or "") // 90) + 1)
        if t == "EVIDENCE_LABELS": return max(2, (len(section.get("items", [])) + 2) // 3)
        if t == "TIMELINE": return sum(2 + len(item.get("bullets", [])) for item in section.get("items", []))
        if t in {"PROJECTS","CLAIMS","CREDENTIALS"}: return max(1, len(section.get("items", [])) * 2)
        return 0
    @staticmethod
    def execute(c3_model: Dict[str, Any], run_policy: Dict[str, Any]) -> Dict[str, Any]:
        ast = c3_model.get("ast_root")
        if not isinstance(ast, dict): raise ValueError("C4 requires C3 ast_root.")
        policy = run_policy or {}
        max_pages = int(policy.get("max_pages", 1))
        lines_per_page = int(policy.get("max_lines_per_page", 52))
        max_allowed_lines = max_pages * lines_per_page
        allocated = 3 + sum(C4LayoutFitter._estimated_lines(s) + 1 for s in ast.get("sections", []))
        if allocated > max_allowed_lines:
            raise ValueError(f"C4 layout overflow: estimated {allocated} lines exceeds policy ceiling {max_allowed_lines}.")
        typography = policy.get("typography") or {
            "font_family": policy.get("font_family", "system-serif"),
            "base_font_size_pt": 10.5, "line_height": 1.35,
            "margin_top_in": 0.5, "margin_bottom_in": 0.5, "margin_horizontal_in": 0.6,
        }
        return {"status":"LAYOUT_VALIDATED","target_pages":max_pages,"line_budget":{
            "allocated_lines":allocated,"max_lines":max_allowed_lines,
            "density_ratio":round(allocated/max_allowed_lines,3) if max_allowed_lines else 0,
            "overflow_detected":False},"typography_spec":typography}
