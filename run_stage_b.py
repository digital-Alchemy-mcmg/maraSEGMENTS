#!/usr/bin/env python3
import sys
import os
import argparse
from src.harness_runner import StageBHarness


def main():
    parser = argparse.ArgumentParser(description="Stage B Harness: B1-B5 + T06 + sidecar termination (fail-closed)")
    parser.add_argument("--envelope", required=True, help="Path to actual Stage A envelope JSON")
    parser.add_argument("--sidecar", required=True, help="Path to actual Stage A sidecar JSON")
    parser.add_argument("--candidate", required=True, help="Path to operator-mounted candidate SDNA YAML")
    parser.add_argument("--output", required=True, help="Explicit Stage C handoff output path")
    args = parser.parse_args()
    for path in (args.envelope, args.sidecar, args.candidate):
        if not os.path.exists(path):
            print(f"Missing required input: {path}", file=sys.stderr)
            return 2
    h = StageBHarness()
    h.load_inputs(args.envelope, args.sidecar, args.candidate)
    result = h.execute_stage_b()
    out = h.export_stage_c_handoff(args.output)
    print(result)
    print({"handoff": out})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
