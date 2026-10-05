#!/usr/bin/env python3
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent
PACKAGE = ROOT / "STAGE_A_YAML_FIRST.zip"

if not PACKAGE.exists():
    raise SystemExit("STAGE_A_YAML_FIRST.zip missing")

with zipfile.ZipFile(PACKAGE, "r") as archive:
    archive.extractall(ROOT)

print("Segment A YAML-first Codespaces runtime installed.")
