#!/usr/bin/env python3
import argparse
from src.harness_runner import StageCHarness

def main():
    parser = argparse.ArgumentParser(description="Canonical Stage C Harness: Resume Factory Pipeline (C1-C5)")
    parser.add_argument("--envelope", required=True, help="Path to an actual Stage B handoff envelope JSON")
    parser.add_argument("--output", default="./output_stage_c", help="Output directory for rendered artifact and completed envelope")
    args = parser.parse_args()
    harness = StageCHarness()
    harness.load_envelope(args.envelope)
    result = harness.execute_stage_c()
    paths = harness.export_artifacts(args.output)
    print({"result": result, "artifacts": paths})

if __name__ == "__main__":
    main()
