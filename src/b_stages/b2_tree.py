import hashlib
import json
from typing import Dict, Any
from ..sidecar.b_sidecar import BSidecar, SidecarStage
from ..envelope.master_envelope import MissingEnvelopeInputError


class B2TreeSynthesizer:
    """B2 reads B1's temporary tag layer and freezes the target competency tree."""

    @staticmethod
    def execute(requirements_taxonomy: Dict[str, Any], sidecar: BSidecar) -> Dict[str, Any]:
        hard = requirements_taxonomy.get("hard_requirements")
        if not hard:
            raise MissingEnvelopeInputError("A_scout.requirements_taxonomy.hard_requirements", "B2_TREE", "hard_requirements cannot be empty.")
        tags = sidecar.read_temporary_tags(SidecarStage.B2)
        by_label = {t.get("requirement_label"): t for t in tags.values()}
        nodes: Dict[str, Any] = {}
        for prefix, reqs, weight, classification in (
            ("hard", hard, "CRITICAL_STAR", "HARD_CORE"),
            ("soft", requirements_taxonomy.get("soft_requirements") or [], "STRONG_TILDE", "ORGANIZATIONAL"),
        ):
            for idx, req in enumerate(reqs, 1):
                tag = by_label.get(req)
                if not tag:
                    raise MissingEnvelopeInputError(f"B1 tag for requirement: {req}", "B2_TREE")
                node_id = f"node.req.{prefix}.{idx:02d}"
                nodes[node_id] = {
                    "address": f"{1 if prefix == 'hard' else 2}.{idx}",
                    "label": req,
                    "weight": weight,
                    "classification": classification,
                    "source_trace": {
                        "tag_id": tag["tag_id"],
                        "source_match": tag.get("source_match", False),
                        "span_start": tag.get("span_start"),
                        "span_end": tag.get("span_end"),
                        "source_excerpt": tag.get("source_excerpt"),
                    },
                }
        canonical = json.dumps(nodes, sort_keys=True, separators=(",", ":"))
        return {
            "root_role": "Target Position Architecture",
            "nodes": nodes,
            "frozen_tree_sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
        }
