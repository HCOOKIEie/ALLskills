const { test } = require("node:test");
const assert = require("node:assert/strict");
const art = require("../covers.js");
test("cover text cannot insert SVG elements or attributes", () => {
  const svg = art.svg({
    id: "acme/skills",
    name: '"><script>alert(1)</script>',
    owner: '<image href="x"/>',
  });
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("<image"));
  assert.ok(svg.includes("&lt;"));
  assert.ok(!/https?:\/\//.test(svg.replace("http://www.w3.org/2000/svg", "")));
});
test("a repository retains its cover across refreshes and titles are bounded", () => {
  const item = { id: "acme/skills", name: "A".repeat(200), owner: "acme" };
  assert.deepEqual(art.spec(item), art.spec({ ...item, stars: 100 }));
  assert.notEqual(art.spec(item).seed, art.spec({ id: "other/skills" }).seed);
  assert.ok(!art.svg(item).includes("A".repeat(25)));
});
