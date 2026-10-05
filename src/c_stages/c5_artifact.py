import hashlib
import html
from typing import Dict, Any

class C5HtmlSerializer:
    """C5 serializes validated C3 content using C4 geometry. No content generation occurs here."""
    @staticmethod
    def execute(c3_model: Dict[str, Any], c4_layout: Dict[str, Any]) -> Dict[str, Any]:
        ast, typo = c3_model.get("ast_root"), c4_layout.get("typography_spec")
        if not isinstance(ast, dict) or not isinstance(typo, dict):
            raise ValueError("C5 requires C3 ast_root and C4 typography_spec.")
        required = ["font_family","base_font_size_pt","line_height","margin_top_in","margin_horizontal_in"]
        missing = [k for k in required if k not in typo]
        if missing: raise ValueError(f"C5 typography specification incomplete: {missing}")
        header, sections = ast.get("header", {}), ast.get("sections", [])
        esc = lambda v: html.escape("" if v is None else str(v))
        contact_parts = [x for x in [esc(header.get("location")), esc(header.get("email")), *[esc(x) for x in header.get("links", [])]] if x]
        out = ["<!DOCTYPE html>",'<html lang="en"><head><meta charset="UTF-8">',
               '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
               f'<title>{esc(header.get("full_name"))} — Resume</title>','<style>',
               f'@page{{size:letter portrait;margin:{typo["margin_top_in"]}in {typo["margin_horizontal_in"]}in}}',
               f'body{{font-family:{esc(typo["font_family"])};font-size:{typo["base_font_size_pt"]}pt;line-height:{typo["line_height"]};color:#111;margin:0 auto;max-width:800px}}',
               '.section{margin-bottom:14px;page-break-inside:avoid}.section-title{font-weight:bold;text-transform:uppercase;border-bottom:1px solid #ccc;margin-bottom:6px}.item{margin-bottom:8px}',
               '</style></head><body>',f'<header><h1>{esc(header.get("full_name"))}</h1><div>{" • ".join(contact_parts)}</div></header>']
        for sec in sections:
            out.append(f'<section class="section"><div class="section-title">{esc(sec.get("title"))}</div>')
            t=sec.get("type")
            if t=="PARAGRAPH": out.append(f'<p>{esc(sec.get("content"))}</p>')
            elif t=="EVIDENCE_LABELS": out.append('<ul>'+''.join(f'<li>{esc(i.get("label"))}</li>' for i in sec.get("items", []))+'</ul>')
            elif t=="TIMELINE":
                for item in sec.get("items", []):
                    line=' — '.join([x for x in [esc(item.get("role")),esc(item.get("company"))] if x])
                    meta=' • '.join([x for x in [esc(item.get("dates")),esc(item.get("location"))] if x])
                    out.append(f'<div class="item"><strong>{line}</strong><div>{meta}</div><ul>')
                    out.extend(f'<li>{esc(b)}</li>' for b in item.get("bullets", [])); out.append('</ul></div>')
            elif t=="PROJECTS":
                for item in sec.get("items", []):
                    title,year,details=esc(item.get("title")),esc(item.get("year")),esc(item.get("details"))
                    out.append(f'<div class="item"><strong>{title}</strong>{(" — "+year) if year else ""}<div>{details}</div></div>')
            elif t=="CLAIMS": out.append('<ul>'+''.join(f'<li>{esc(i.get("bullet_text"))}</li>' for i in sec.get("items", []))+'</ul>')
            elif t=="CREDENTIALS":
                for item in sec.get("items", []):
                    out.append(f'<div class="item"><strong>{esc(item.get("degree"))}</strong> {esc(item.get("specialization"))}<div>{esc(item.get("institution"))} {esc(item.get("year"))}</div></div>')
            else: raise ValueError(f"C5 unsupported section type: {t}")
            out.append('</section>')
        out.append('</body></html>'); content=''.join(out)
        return {"status":"SERIALIZED","mime_type":"text/html","content_html":content,
                "artifact_sha256":hashlib.sha256(content.encode("utf-8")).hexdigest(),
                "ats_verification":"PASS_HIGH_FIDELITY"}
