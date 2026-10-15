import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("snapshot_state", Path(__file__).resolve().parents[1] / "tools" / "snapshot_state.py")
s = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(s)


class SnapshotStateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix=".collector-test-", dir=Path(__file__).resolve().parent)
        self.base = Path(self.tmp.name)
        self.remote = self.base / "remote.git"
        self.root = self.base / "source"
        self.root.mkdir()
        s.git(self.base, "init", "--bare", str(self.remote))
        s.git(self.root, "init")
        s.git(self.root, "remote", "add", "origin", str(self.remote))
        (self.root / "source.txt").write_text("source stays intact", encoding="utf-8")
        s.git(self.root, "add", "source.txt")
        s.git(self.root, "-c", "commit.gpgsign=false", "commit", "-m", "source")
        self.source_head = s.git(self.root, "rev-parse", "HEAD").stdout

    def tearDown(self):
        self.tmp.cleanup()

    def write_snapshot(self, stars=10):
        (self.root / "data").mkdir(exist_ok=True)
        meta = {"generatedAt": f"2026-10-15T{stars % 24:02d}:00:00Z"}
        payload = {"meta": meta, "skills": [{"id": "acme/skills", "stars": stars}]}
        files = {"skills.json": json.dumps(payload), "skills.js": "window.SKILL_DATA=" + json.dumps(payload) + ";",
                 "meta.json": json.dumps(meta), "star_history.json": json.dumps({"version": 1, "repos": {"acme/skills": [[123, stars]]}})}
        for name, content in files.items():
            (self.root / "data" / name).write_text(content, encoding="utf-8")

    def test_first_run_persists_only_data_and_restore_keeps_source_checkout(self):
        self.assertFalse(s.restore(self.root))
        self.write_snapshot()
        commit = s.persist(self.root)
        paths = s.git(self.root, "ls-tree", "-r", "--name-only", commit).stdout.decode().splitlines()
        self.assertEqual(sorted(paths), sorted("data/" + name for name in s.FILES))
        (self.root / "data" / "skills.json").write_text("broken", encoding="utf-8")
        self.assertTrue(s.restore(self.root))
        self.assertEqual(json.loads((self.root / "data" / "skills.json").read_text())["skills"][0]["stars"], 10)
        self.assertEqual(s.git(self.root, "rev-parse", "HEAD").stdout, self.source_head)
        self.assertEqual(s.git(self.root, "diff", "--cached").stdout, b"")

    def test_consecutive_runs_preserve_history_and_unchanged_snapshots_do_not_commit(self):
        self.write_snapshot(10)
        first = s.persist(self.root)
        self.assertEqual(s.persist(self.root), first)
        self.write_snapshot(11)
        second = s.persist(self.root)
        self.assertNotEqual(first, second)
        self.assertEqual(s.git(self.root, "rev-parse", second + "^").stdout.decode().strip(), first)

    def test_inconsistent_metadata_is_rejected_before_publication(self):
        self.write_snapshot()
        (self.root / "data" / "meta.json").write_text(json.dumps({"generatedAt": "wrong"}))
        with self.assertRaises(ValueError):
            s.persist(self.root)
        self.assertIsNone(s.remote_head(self.root))


if __name__ == "__main__":
    unittest.main()
