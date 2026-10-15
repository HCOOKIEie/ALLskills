const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const C = require("../core.js");
const fixture = (overrides = {}) =>
  C.normalize({
    id: "acme/frontend-skills",
    name: "frontend-skills",
    description: "React design and browser testing",
    category: "编程开发",
    language: "TypeScript",
    topics: ["react", "agent-skills"],
    verified: true,
    skillCount: 8,
    skillSignal: true,
    stars: 500,
    pushedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  });

const observedNow = Date.parse("2026-10-15T12:00:00Z");
const growth = (delta, overrides = {}) => ({
  delta,
  baselineStars: 1000,
  baselineAt: "2026-10-14T12:00:00Z",
  observedAt: "2026-10-15T12:00:00Z",
  ...overrides,
});

test("today ranking sorts actual gains, excludes stale samples, losses, archives and non-Skills", () => {
  const records = [
    fixture({ id: "one/skill", stars: 900000, starGrowth: growth(5) }),
    fixture({ id: "two/skill", stars: 1200, starGrowth: growth(200) }),
    fixture({ id: "loss/skill", starGrowth: growth(-10) }),
    fixture({
      id: "old/skill",
      starGrowth: growth(1000, {
        baselineAt: "2026-10-13T12:00:00Z",
        observedAt: "2026-10-14T12:00:00Z",
      }),
    }),
    fixture({ id: "archive/skill", archived: true, starGrowth: growth(5000) }),
    fixture({
      id: "other/tool",
      verified: false,
      skillCount: null,
      skillSignal: false,
      starGrowth: growth(5000),
    }),
  ];
  assert.deepEqual(
    C.growthRanking(records, 30, observedNow).map((s) => s.id),
    ["two/skill", "one/skill"],
  );
  assert.equal(
    C.normalizeGrowth(growth(10, { baselineAt: "2026-10-15T00:00:00Z" })),
    null,
  );
  assert.equal(
    C.normalizeGrowth(growth(10, { baselineStars: 0 })).percent,
    null,
  );
  assert.equal(C.normalizeGrowth(growth(100, { percent: 999 })).percent, 10);
});

test("a newer published observation replaces stale live metadata while live sync retains measured gains", () => {
  const snapshot = fixture({
    stars: 1100,
    observedAt: "2026-10-15T12:00:00Z",
    starGrowth: growth(100),
  });
  const oldLive = fixture({
    stars: 1000,
    observedAt: "2026-10-15T09:00:00Z",
    live: true,
  });
  assert.equal(C.mergeSkills([snapshot], [oldLive])[0].stars, 1100);
  const newLive = fixture({
    stars: 1110,
    observedAt: "2026-10-15T13:00:00Z",
    live: true,
  });
  const merged = C.mergeSkills([snapshot], [newLive])[0];
  assert.equal(merged.stars, 1110);
  assert.equal(merged.starGrowth.delta, 100);
  assert.equal(merged.starGrowth.observedAt, "2026-10-15T12:00:00.000Z");
});

test("automatic checks download metadata only when the published snapshot has not advanced", async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return {
      ok: true,
      json: async () => ({ generatedAt: "2026-10-15T12:00:00Z" }),
    };
  };
  const result = await C.checkPublishedSnapshot(
    "https://example.com/data/skills.json",
    { generatedAt: "2026-10-15T12:00:00Z" },
    fetcher,
  );
  assert.equal(result.changed, false);
  assert.deepEqual(urls, ["https://example.com/data/meta.json"]);
});

test("automatic updates adopt a complete newer dataset and reject partial or inconsistent responses", async () => {
  const meta = { generatedAt: "2026-10-15T12:00:00Z", reposKept: 1 };
  let body = { meta, skills: [fixture()] };
  const fetcher = async (url) => ({
    ok: true,
    json: async () => (url.endsWith("meta.json") ? meta : body),
  });
  const current = { generatedAt: "2026-10-14T12:00:00Z" };
  const result = await C.checkPublishedSnapshot(
    "https://example.com/data/skills.json",
    current,
    fetcher,
  );
  assert.equal(result.changed, true);
  assert.equal(result.skills.length, 1);
  body = { meta, skills: [] };
  await assert.rejects(
    C.checkPublishedSnapshot(
      "https://example.com/data/skills.json",
      current,
      fetcher,
    ),
  );
  body = { meta: { generatedAt: "2026-10-13T12:00:00Z" }, skills: [fixture()] };
  await assert.rejects(
    C.checkPublishedSnapshot(
      "https://example.com/data/skills.json",
      current,
      fetcher,
    ),
  );
  await assert.rejects(
    C.checkPublishedSnapshot("javascript:alert(1)", current, fetcher),
  );
});

test("multi-term, quoted, field and exclusion search compose with AND", () => {
  const records = [
    fixture(),
    fixture({
      id: "other/backend",
      description: "React server design",
      language: "Python",
      topics: ["backend"],
    }),
  ];
  const find = (q) => C.filterSkills(records, { q }).map((s) => s.id);
  assert.deepEqual(find("react testing"), ["acme/frontend-skills"]);
  assert.deepEqual(
    find('"browser testing" lang:typescript owner:acme topic:react'),
    ["acme/frontend-skills"],
  );
  assert.deepEqual(find("react -lang:python"), ["acme/frontend-skills"]);
  assert.deepEqual(find("前端 -testing"), ["other/backend"]);
  assert.equal(find('"testing browser"').length, 0);
  assert.deepEqual(find("constructor"), []);
  assert.deepEqual(find("__proto__"), []);
});
test("category, language, verification and signal filters all apply", () => {
  const records = [
    fixture(),
    fixture({
      id: "other/agent",
      category: "Agent 框架",
      verified: false,
      skillCount: null,
      language: "Python",
      skillSignal: false,
    }),
  ];
  assert.deepEqual(
    C.filterSkills(records, {
      cat: "编程开发",
      language: "TypeScript",
      verifiedOnly: true,
      skillOnly: true,
    }).map((s) => s.id),
    ["acme/frontend-skills"],
  );
  assert.equal(
    C.filterSkills(records, { cat: "Agent 框架", verifiedOnly: true }).length,
    0,
  );
  assert.equal(C.filterSkills(records, { language: "Ruby" }).length, 0);
});
test("live merge updates metadata and preserves snapshot verification provenance", () => {
  const old = fixture({
    verifiedSource: "github-tree",
    verifiedAt: "2026-09-01",
    stars: 500,
  });
  const live = C.normalizeLive({
    full_name: "ACME/frontend-skills",
    name: "frontend-skills",
    stargazers_count: 450,
    description: "new description",
    created_at: "2026-01-01",
    pushed_at: "2026-10-12",
    topics: ["skills"],
  });
  const merged = C.mergeSkills([old], [live]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].stars, 450);
  assert.equal(merged[0].description, "new description");
  assert.equal(merged[0].verified, true);
  assert.equal(merged[0].skillCount, 8);
  assert.equal(merged[0].verifiedSource, "github-tree");
  assert.equal(merged[0].verifiedAt, "2026-09-01");
  assert.equal(merged[0].live, true);
  assert.equal(live.verified, false);
});
test("untrusted URLs and malformed imported records cannot create executable links", () => {
  assert.equal(C.safeUrl("javascript:alert(1)"), "");
  assert.equal(C.safeUrl("data:text/html,unsafe"), "");
  assert.equal(C.normalize({ id: "../../evil" }), null);
  assert.equal(C.normalize({ id: "acme/.." }), null);
  assert.equal(fixture({ category: "__proto__" }).category, "其他");
  const skill = fixture({
    url: "javascript:alert(1)",
    homepage: "javascript:alert(1)",
    avatar: "data:image/svg+xml,unsafe",
    skillCount: 0,
    verified: true,
    stars: Infinity,
  });
  assert.equal(skill.url, "https://github.com/acme/frontend-skills");
  assert.equal(skill.homepage, "");
  assert.equal(skill.avatar, "");
  assert.equal(skill.verified, false);
  assert.equal(skill.stars, 0);
  assert.equal(C.esc('<img onerror="x">'), "&lt;img onerror=&quot;x&quot;&gt;");
});
test("daily picks stay relevant, exclude archives, rotate, and never duplicate", () => {
  const records = Array.from({ length: 18 }, (_, i) =>
    fixture({
      id: "owner" + i + "/skill",
      category: i < 9 ? "设计创意" : "编程开发",
    }),
  );
  records.push(
    fixture({
      id: "archive/skill",
      category: "设计创意",
      archived: true,
      stars: 10000000,
    }),
  );
  const date = new Date(2026, 9, 15);
  const a = C.dailyPicks(records, "create", 0, date),
    b = C.dailyPicks(records, "create", 1, date);
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((s) => s.id)).size, 3);
  assert.ok(a.every((s) => s.category === "设计创意" && !s.archived));
  assert.notDeepEqual(
    a.map((s) => s.id),
    b.map((s) => s.id),
  );
  assert.equal(C.dailyPicks([fixture()], "all", 0, date).length, 1);
  assert.deepEqual(C.dailyPicks([], "all", 0, date), []);
});
test("sorting uses the requested metric and does not mutate the source", () => {
  const records = [
    fixture({ id: "b/skill", stars: 1, skillCount: 20, pushedAt: null }),
    fixture({ id: "a/skill", stars: 1000, skillCount: 2 }),
  ];
  assert.equal(C.sortSkills(records, "stars")[0].id, "a/skill");
  assert.equal(C.sortSkills(records, "skills")[0].id, "b/skill");
  assert.equal(C.sortSkills(records, "recent")[0].id, "a/skill");
  assert.equal(records[0].id, "b/skill");
});
test("committed snapshot loads with consistent counts and unique repository IDs", () => {
  const payload = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/skills.json"), "utf8"),
  );
  const records = payload.skills.map(C.normalize);
  assert.ok(records.every(Boolean));
  assert.equal(
    new Set(records.map((s) => s.id.toLowerCase())).size,
    records.length,
  );
  assert.equal(records.length, payload.meta.reposKept);
  assert.equal(
    records.filter((s) => s.verified).length,
    payload.meta.verifiedRepos,
  );
  assert.equal(
    records.reduce((sum, s) => sum + (s.skillCount || 0), 0),
    payload.meta.skillsCounted,
  );
});
