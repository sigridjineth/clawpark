#!/usr/bin/env python3
import argparse
import json
import os
import pathlib
import sys
import tempfile
import urllib.request
import uuid
import zipfile
from typing import Iterable

CLAW_ROOT_FILES = ["IDENTITY.md", "SOUL.md", "TOOLS.md"]
SKILL_OPTIONAL_DIRS = ["scripts", "assets", "references"]
SKILL_OPTIONAL_FILES = ["README.md"]


def die(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def iter_claw_files(workspace: pathlib.Path) -> Iterable[pathlib.Path]:
    for name in CLAW_ROOT_FILES:
        path = workspace / name
        if path.exists() and path.is_file():
            yield path
    skills_dir = workspace / "skills"
    if skills_dir.exists():
      for skill_md in skills_dir.glob("*/SKILL.md"):
          if skill_md.is_file():
              yield skill_md


def iter_skill_files(skill_dir: pathlib.Path) -> Iterable[pathlib.Path]:
    required = skill_dir / "SKILL.md"
    if not required.is_file():
        die(f"Missing required SKILL.md in {skill_dir}")
    yield required
    for name in SKILL_OPTIONAL_FILES:
        path = skill_dir / name
        if path.is_file():
            yield path
    for dirname in SKILL_OPTIONAL_DIRS:
        base = skill_dir / dirname
        if base.exists():
            for path in base.rglob("*"):
                if path.is_file():
                    yield path


def build_zip(source_root: pathlib.Path, files: Iterable[pathlib.Path], destination: pathlib.Path) -> None:
    files = list(dict.fromkeys(files))
    if not files:
        die("No files matched the publishing allowlist.")
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            zf.write(path, arcname=path.relative_to(source_root))


def encode_multipart(fields: dict[str, str], file_field: str, filename: str, payload: bytes, content_type: str):
    boundary = f"----clawpark-{uuid.uuid4().hex}"
    body = bytearray()

    for key, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        body.extend(str(value).encode())
        body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode())
    body.extend(
        f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'.encode()
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode())
    body.extend(payload)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    return boundary, bytes(body)


def upload_bundle(endpoint: str, publisher_label: str, bundle_path: pathlib.Path, title: str | None, summary: str | None):
    payload = bundle_path.read_bytes()
    fields = {"publisherLabel": publisher_label}
    if title:
        fields["title"] = title
    if summary:
        fields["summary"] = summary
    boundary, body = encode_multipart(fields, "bundle", bundle_path.name, payload, "application/zip")

    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        data = response.read().decode("utf-8")
        return json.loads(data)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish a Claw or skill bundle into ClawPark marketplace.")
    parser.add_argument("--marketplace-url", default=os.environ.get("CLAWPARK_MARKETPLACE_URL", "http://localhost:8787"))
    parser.add_argument("--publisher-label", default=os.environ.get("CLAWPARK_PUBLISHER_LABEL") or os.environ.get("USER") or "Unsigned Publisher")

    subparsers = parser.add_subparsers(dest="kind", required=True)

    claw = subparsers.add_parser("claw", help="Publish the current OpenClaw workspace as a Claw listing.")
    claw.add_argument("--workspace", default=".")
    claw.add_argument("--title")
    claw.add_argument("--summary")

    skill = subparsers.add_parser("skill", help="Publish a skill directory as a Skill listing.")
    skill.add_argument("path")
    skill.add_argument("--title")
    skill.add_argument("--summary")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    marketplace_url = args.marketplace_url.rstrip("/")

    with tempfile.TemporaryDirectory(prefix="clawpark-publish-") as temp_dir:
        bundle_path = pathlib.Path(temp_dir) / "bundle.zip"

        if args.kind == "claw":
            workspace = pathlib.Path(args.workspace).resolve()
            files = list(iter_claw_files(workspace))
            required = {workspace / "IDENTITY.md", workspace / "SOUL.md"}
            if not all(path.is_file() for path in required):
                die("Claw publish requires IDENTITY.md and SOUL.md in the workspace root.")
            build_zip(workspace, files, bundle_path)
            result = upload_bundle(
                f"{marketplace_url}/api/marketplace/ingest/claw",
                args.publisher_label,
                bundle_path,
                args.title,
                args.summary,
            )
        else:
            skill_dir = pathlib.Path(args.path).resolve()
            build_zip(skill_dir, iter_skill_files(skill_dir), bundle_path)
            result = upload_bundle(
                f"{marketplace_url}/api/marketplace/ingest/skill",
                args.publisher_label,
                bundle_path,
                args.title,
                args.summary,
            )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
