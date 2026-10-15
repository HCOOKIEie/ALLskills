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
        with patch.object(c, "core_request_budget", return_value=5), patch.object(c, "tree_skill_count", return_value=None):
            self.assertEqual(c.phase_verify(5, 3), old)

    def test_growth_needs_two_real_observations_and_does_not_extrapolate(self):
        now = datetime(2026, 10, 15, 12, tzinfo=timezone.utc)
        record = {"id": "acme/skills", "stars": 1100, "observedAt": now.isoformat()}
        history = {"version": 1, "repos": {}}
        meta = c.update_star_history([record], history, now)
        self.assertIsNone(record["starGrowth"])
        self.assertEqual(meta["status"], "warming")
        self.assertEqual(meta["freshRepos"], 1)
        c.update_star_history([record], history, now)
        self.assertEqual(len(history["repos"]["acme/skills"]), 1)
        history["repos"]["acme/skills"].append([int((now - timedelta(hours=12)).timestamp()), 1000])
        c.update_star_history([record], history, now)
        self.assertIsNone(record["starGrowth"])

    def test_growth_chooses_the_nearest_24_hour_baseline_and_retains_net_losses(self):
        now = datetime(2026, 10, 15, 12, tzinfo=timezone.utc)
        record = {"id": "Acme/skills", "stars": 1100, "observedAt": now.isoformat()}
        history = {"version": 1, "repos": {"acme/skills": [
            [int((now - timedelta(hours=25)).timestamp()), 900],
            [int((now - timedelta(hours=24)).timestamp()), 1000],
            [int((now - timedelta(hours=23)).timestamp()), 1050]]}}
        meta = c.update_star_history([record], history, now)
        self.assertEqual(record["starGrowth"]["delta"], 100)
        self.assertEqual(record["starGrowth"]["percent"], 10)
        self.assertEqual(record["starGrowth"]["hours"], 24)
        self.assertEqual(meta["positiveRepos"], 1)
        record["stars"] = 900
        meta = c.update_star_history([record], history, now)
        self.assertEqual(record["starGrowth"]["delta"], -100)
        self.assertEqual(meta["positiveRepos"], 0)
        self.assertEqual(meta["comparableRepos"], 1)

    def test_stale_or_missing_observation_is_not_current_growth(self):
        now = datetime(2026, 10, 15, 12, tzinfo=timezone.utc)
        observed = now - timedelta(hours=7)
        history = {"version": 1, "repos": {"acme/skills": [[int((observed - timedelta(hours=24)).timestamp()), 100]]}}
        record = {"id": "acme/skills", "stars": 200, "observedAt": observed.isoformat()}
        self.assertEqual(c.update_star_history([record], history, now)["freshRepos"], 0)
        self.assertIsNone(record["starGrowth"])
        record["observedAt"] = None
        self.assertEqual(c.update_star_history([record], history, now)["comparableRepos"], 0)

    def test_history_prunes_old_samples_and_handles_a_zero_star_baseline(self):
        now = datetime(2026, 10, 15, 12, tzinfo=timezone.utc)
        history = {"version": 1, "repos": {"acme/skills": [
            [int((now - timedelta(days=9)).timestamp()), 0],
            [int((now - timedelta(hours=24)).timestamp()), 0]]}}
        record = {"id": "acme/skills", "stars": 5, "observedAt": now.isoformat()}
        c.update_star_history([record], history, now)
        self.assertEqual(record["starGrowth"]["delta"], 5)
        self.assertIsNone(record["starGrowth"]["percent"])
        self.assertEqual(len(history["repos"]["acme/skills"]), 2)

    def test_failed_metadata_refresh_does_not_invent_an_observation(self):
        old = {**self.repo, "_observedAt": "2026-01-01T00:00:00Z"}
        c.RAW_FILE.write_text(json.dumps({"repos": [old]}), encoding="utf-8")
        with patch.object(c, "core_request_budget", return_value=1), patch.object(c, "api_get", return_value=None):
            result = c.phase_refresh(1, 1)
        self.assertEqual(result["repos"], [old])

    def test_request_budget_uses_actual_quota_and_reserves_publishing_capacity(self):
        previous = dict(c.RATE)
        self.addCleanup(c.rate_set, **previous)
        with patch.object(c, "api_get", return_value={"resources": {"core": {"remaining": 180, "reset": 999}}}):
            self.assertEqual(c.core_request_budget(3500, reserve=50), 130)
            self.assertEqual(c.core_request_budget(100, reserve=400), 0)
        with patch.object(c, "api_get", return_value=None):
            self.assertEqual(c.core_request_budget(500), 0)

    def test_exhausted_core_quota_does_not_wait_or_send_queued_requests(self):
        previous = dict(c.RATE)
        self.addCleanup(c.rate_set, **previous)
        c.rate_set(core_remaining=0)
        with patch.object(c.urllib.request, "urlopen") as request, patch.object(c, "sleep_until") as sleep:
            self.assertIsNone(c.api_get("https://api.github.com/repos/acme/skills", "core"))
        request.assert_not_called()
        sleep.assert_not_called()

    def test_cache_eviction_keeps_published_verification(self):
        c.RAW_FILE.write_text(json.dumps({"repos": [{**self.repo, "_observedAt": datetime.now(timezone.utc).isoformat()}]}), encoding="utf-8")
        (self.root / "skills.json").write_text(json.dumps({"skills": [{"id": "acme/skills", "skillCount": 7,
            "verifiedSource": "github-tree", "verifiedAt": "2026-10-01T00:00:00Z"}]}), encoding="utf-8")
        result = c.phase_emit(3)
        self.assertTrue(result["skills"][0]["verified"])
        self.assertEqual(result["skills"][0]["verifiedSource"], "github-tree")
        self.assertEqual(result["meta"]["growth"]["status"], "warming")
        self.assertTrue((self.root / "star_history.json").exists())

    def test_renamed_and_case_changed_repositories_are_deduplicated_by_latest_observation(self):
        old = {**self.repo, "id": 100, "full_name": "acme/old", "_observedAt": "2026-10-01T00:00:00Z"}
        new = {**old, "full_name": "Acme/new", "_observedAt": "2026-10-15T00:00:00Z"}
        duplicate = {**new, "full_name": "acme/NEW", "_observedAt": "2026-10-14T00:00:00Z"}
        self.assertEqual(c.dedupe_repos([old, new, duplicate]), [new])


if __name__ == "__main__":
    unittest.main()
