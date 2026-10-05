#!/usr/bin/env python3
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent
PACKAGE = ROOT / "STAGE_A_YAML_FIRST.zip"

if not PACKAGE.exists():
    raise SystemExit("STAGE_A_YAML_FIRST.zip missing")

with zipfile.ZipFile(PACKAGE, "r") as archive:
    archive.extractall(ROOT)

# Enforce the canonical cross-segment SDNA contract at the runnable surface.
# The packaged backend is YAML-first; these replacements remove stale JSON UI wording.
ui = ROOT / "index.html"
if ui.exists():
    text = ui.read_text(encoding="utf-8")
    replacements = {
        "A1 — CANONICAL SDNA PACKAGE JSON": "A1 — CANONICAL SDNA YAML",
        "A1 - CANONICAL SDNA PACKAGE JSON": "A1 — CANONICAL SDNA YAML",
        "Paste your SDNA JSON here": "Paste canonical SDNA YAML here",
        "Canonical SDNA Package JSON": "Canonical SDNA YAML",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    ui.write_text(text, encoding="utf-8")

    stale = ("SDNA PACKAGE JSON", "SDNA JSON")
    if any(token in text.upper() for token in stale):
        raise SystemExit("Stage A bootstrap halted: stale JSON-SDNA UI contract remains.")

print("Segment A canonical SDNA YAML Codespaces runtime installed.")
