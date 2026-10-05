from typing import Dict, Any, List, Tuple
from ..sidecar.b_sidecar import BSidecar, SidecarStage
from ..envelope.master_envelope import MissingEnvelopeInputError


class B1DecoupleProcessor:
    """B1 owns target-source decomposition and temporary sidecar tags only."""

    @staticmethod
    def _locate(raw_text: str, requirement: str) -> Tuple[int | None, int | None, str | None]:
        needle = requirement.strip()
        if not needle:
            return None, None, None
        idx = raw_text.casefold().find(needle.casefold())
        if idx < 0:
            return None, None, None
        end = idx + len(needle)
        return idx, end, raw_text[idx:end]

    @staticmethod
    def execute(sidecar: BSidecar, requirements_taxonomy: Dict[str, Any]) -> Dict[str, Any]:
        hard = requirements_taxonomy.get("hard_requirements")
        if not hard:
            raise MissingEnvelopeInputError("A_scout.requirements_taxonomy.hard_requirements", "B1_DECOUPLE", "hard_requirements cannot be empty.")
        soft = requirements_taxonomy.get("soft_requirements") or []
        raw_text = sidecar.read_source_text(SidecarStage.B1)
        if not raw_text.strip():
            raise MissingEnvelopeInputError("sidecar.raw_text", "B1_DECOUPLE", "Sidecar raw text is empty.")

        tag_ids: List[str] = []
        for classification, requirements in (("HARD_REQUIREMENT", hard), ("SOFT_REQUIREMENT", soft)):
            for req in requirements:
                idx = len(tag_ids) + 1
                tag_id = f"tag-b1-{idx:03d}"
                start, end, excerpt = B1DecoupleProcessor._locate(raw_text, req)
                sidecar.write_temporary_tag(tag_id, {
                    "tag_id": tag_id,
                    "requirement_label": req,
                    "classification": classification,
                    "source_match": start is not None,
                    "span_start": start,
                    "span_end": end,
                    "source_excerpt": excerpt,
                }, SidecarStage.B1)
                tag_ids.append(tag_id)
        return {"status": "B1_DECOUPLED_TAGGED", "tag_ids": tag_ids, "tag_count": len(tag_ids)}
