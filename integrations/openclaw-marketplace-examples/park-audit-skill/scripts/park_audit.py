#!/usr/bin/env python3

"""Minimal example entry script for the Park Audit skill bundle."""

from pathlib import Path


def main() -> None:
    checklist = Path("references/checklist.md")
    print("Park Audit ready.")
    print(f"Checklist file: {checklist}")


if __name__ == "__main__":
    main()
