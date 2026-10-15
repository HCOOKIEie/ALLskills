import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("collector", Path(__file__).resolve().parents[1] / "tools" / "collect_skills.py")
c = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(c)


class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix=".collector-test-", dir=Path(__file__).resolve().parent)
        self.root = Path(self.tmp.name)
        self.patchers = [patch.object(c, "DATA_DIR", self.root),
                         patch.object(c, "RAW_FILE", self.root / "raw.json"),
                         patch.object(c, "CACHE_FILE", self.root / "verify.json"),
                         patch.object(c, "JSDELIVR_FILE", self.root / "mirror.json")]
        for p in self.patchers:
            p.start()
        self.repo = {"full_name": "acme/skills", "name": "skills", "description": "AI agent skills", "stargazers_count": 15,
                     "default_branch": "release/next", "pushed_at": "2026-10-01T00:00:00Z", "topics": []}

    def tearDown(self):
        for p in self.patchers:
            p.stop()
        self.tmp.cleanup()

    def test_only_literal_skill_filename_counts(self):
        self.assertTrue(c.is_skill_file("agents/build/SKILL.md"))
        self.assertTrue(c.is_skill_file("skill.MD"))
        for name in ["skills.md", "SKILL.md.bak", "SKILL.md/readme", None]:
            self.assertFalse(c.is_skill_file(name))

    def test_incomplete_or_inaccessible_tree_is_not_a_verified_zero(self):
        with patch.object(c, "api_get", return_value={"tree": [{"type": "blob", "path": "SKILL.md"}], "truncated": True}):
            self.assertIsNone(c.tree_skill_count(self.repo))
        with patch.object(c, "api_get", return_value="404"):
            self.assertIsNone(c.tree_skill_count(self.repo))
        with patch.object(c, "api_get", return_value={"tree": []}) as get:
            self.assertEqual(c.tree_skill_count(self.repo), 0)
            self.assertIn("release%2Fnext", get.call_args.args[0])

    def test_success_cache_expires_or_invalidates_on_push_and_failures_retry(self):
        now = datetime(2026, 10, 15, tzinfo=timezone.utc)
        entry = {"skillCount": 5, "checkedAt": (now - timedelta(days=1)).isoformat(), "pushedAt": self.repo["pushed_at"]}
        self.assertTrue(c.cache_is_fresh(entry, self.repo, now))
        self.assertFalse(c.cache_is_fresh(entry, {**self.repo, "pushed_at": "2026-10-14"}, now))
        self.assertFalse(c.cache_is_fresh({**entry, "error": True}, self.repo, now))
        self.assertFalse(c.cache_is_fresh({**entry, "checkedAt": "invalid"}, self.repo, now))
        self.assertFalse(c.cache_is_fresh({**entry, "checkedAt": (now - timedelta(days=8)).isoformat()}, self.repo, now))

    def test_no_pending_verification_exits_cleanly(self):
        c.RAW_FILE.write_text(json.dumps({"repos": []}), encoding="utf-8")
        self.assertEqual(c.phase_verify(40, 3), {})

    def test_search_refresh_accepts_decreasing_stars_and_updated_metadata(self):
        c.RAW_FILE.write_text(json.dumps({"repos": [self.repo]}), encoding="utf-8")
        updated = {**self.repo, "stargazers_count": 9, "description": "fresh description"}
        with patch.object(c, "SEARCH_QUERIES", [("skills", "stars", 1)]), patch.object(c, "api_get", return_value={"items": [updated]}):
            result = c.phase_search(1, 3)
        self.assertEqual(result["repos"][0]["stargazers_count"], 9)
        self.assertEqual(result["repos"][0]["description"], "fresh description")

    def test_network_failure_preserves_raw_data(self):
        previous = json.dumps({"repos": [self.repo]})
        c.RAW_FILE.write_text(previous, encoding="utf-8")
        with patch.object(c, "SEARCH_QUERIES", [("skills", "stars", 1)]), patch.object(c, "api_get", return_value=None):
            with self.assertRaises(RuntimeError):
                c.phase_search(1, 3)
        self.assertEqual(c.RAW_FILE.read_text(encoding="utf-8"), previous)

    def test_empty_emit_preserves_published_snapshot(self):
        c.RAW_FILE.write_text(json.dumps({"repos": []}), encoding="utf-8")
        target = self.root / "skills.json"
        target.write_text("original", encoding="utf-8")
        with self.assertRaises(RuntimeError):
            c.phase_emit(3)
        self.assertEqual(target.read_text(encoding="utf-8"), "original")

    def test_transient_verification_failure_keeps_previous_count(self):
        c.RAW_FILE.write_text(json.dumps({"repos": [self.repo]}), encoding="utf-8")
        old = {self.repo["full_name"]: {"skillCount": 7, "checkedAt": "2026-01-01T00:00:00Z"}}
        c.CACHE_FILE.write_text(json.dumps(old), encoding="utf-8")
        with patch.object(c, "tree_skill_count", return_value=None):
            self.assertEqual(c.phase_verify(5, 3), old)


if __name__ == "__main__":
    unittest.main()
