#!/usr/bin/env python3
"""Keep published data and star baselines on a separate Git branch.

Only four fixed data files are restored/published. Git plumbing avoids switching
the source checkout or altering its index. Authentication comes from checkout's
existing Git credential configuration; this script never handles tokens.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path

BRANCH = "skillatlas-data"
FILES = ("skills.json", "skills.js", "meta.json", "star_history.json")


def git(root: Path, *args: str, content: bytes | None = None, check: bool = True):
    env = {**os.environ, "GIT_AUTHOR_NAME": "github-actions[bot]",
           "GIT_AUTHOR_EMAIL": "41898282+github-actions[bot]@users.noreply.github.com",
           "GIT_COMMITTER_NAME": "github-actions[bot]",
           "GIT_COMMITTER_EMAIL": "41898282+github-actions[bot]@users.noreply.github.com"}
    return subprocess.run(["git", *args], cwd=root, input=content, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, check=check, env=env)


def remote_head(root: Path) -> str | None:
    result = git(root, "ls-remote", "--exit-code", "--heads", "origin", f"refs/heads/{BRANCH}", check=False)
    if result.returncode == 2:
        return None
    if result.returncode:
        raise RuntimeError("Cannot read the durable snapshot branch; refusing to replace its history")
    git(root, "fetch", "--depth=1", "origin", BRANCH)
    return git(root, "rev-parse", "FETCH_HEAD").stdout.decode().strip()


def restore(root: Path) -> bool:
    head = remote_head(root)
    if not head:
        print("No durable snapshot yet; the first successful collection will create it.")
        return False
    # Read and validate all files before replacing anything in the checkout.
    contents = {name: git(root, "show", f"{head}:data/{name}").stdout for name in FILES}
    payload = json.loads(contents["skills.json"])
    meta = json.loads(contents["meta.json"])
    history = json.loads(contents["star_history.json"])
    if not payload.get("skills") or meta.get("generatedAt") != payload.get("meta", {}).get("generatedAt"):
        raise ValueError("Durable snapshot metadata is inconsistent")
    if history.get("version") != 1 or not isinstance(history.get("repos"), dict):
        raise ValueError("Durable star history is invalid")
    (root / "data").mkdir(exist_ok=True)
    for name, content in contents.items():
        (root / "data" / name).write_bytes(content)
    print(f"Restored data and star history from {head[:12]}")
    return True


def persist(root: Path) -> str:
    head = remote_head(root)
    files = {name: (root / "data" / name).read_bytes() for name in FILES}
    payload = json.loads(files["skills.json"])
    history = json.loads(files["star_history.json"])
    meta = json.loads(files["meta.json"])
    if not payload.get("skills") or history.get("version") != 1 or not isinstance(history.get("repos"), dict):
        raise ValueError("Refusing to publish an empty snapshot or invalid star history")
    if meta.get("generatedAt") != payload.get("meta", {}).get("generatedAt"):
        raise ValueError("Snapshot metadata is inconsistent")
    entries = []
    for name, content in files.items():
        sha = git(root, "hash-object", "-w", "--stdin", content=content).stdout.decode().strip()
        entries.append(f"100644 blob {sha}\t{name}\n")
    data_tree = git(root, "mktree", content="".join(sorted(entries)).encode()).stdout.decode().strip()
    tree = git(root, "mktree", content=f"040000 tree {data_tree}\tdata\n".encode()).stdout.decode().strip()
    if head and git(root, "rev-parse", f"{head}^{{tree}}").stdout.decode().strip() == tree:
        print("Published snapshot is unchanged; preserving the existing baseline.")
        return head
    args = ["commit-tree", tree] + (["-p", head] if head else [])
    commit = git(root, *args, content=b"data: refresh Skills snapshot and measured star history\n").stdout.decode().strip()
    # A normal push rejects concurrent changes; never overwrite another run.
    git(root, "push", "origin", f"{commit}:refs/heads/{BRANCH}")
    print(f"Persisted snapshot and star history as {commit[:12]}")
    return commit


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["restore", "persist"])
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    (restore if args.mode == "restore" else persist)(root)


if __name__ == "__main__":
    main()
