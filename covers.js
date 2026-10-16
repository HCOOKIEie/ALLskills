/* SkillAtlas original generative cover art. No external images or fonts. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SkillCovers = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var palettes = [
    ["#d8b49a", "#362e29", "#a94f32"],
    ["#254c6c", "#f2ede1", "#a7c4cc"],
    ["#dcded2", "#28372f", "#657e60"],
    ["#c9c1ce", "#393443", "#786583"],
    ["#e7dfce", "#3e3d34", "#b66a41"],
    ["#252f35", "#f0e6d5", "#c1baa4"],
  ];
  function hash(value) {
    var h = 2166136261;
    String(value || "skill")
      .slice(0, 300)
      .split("")
      .forEach(function (c) {
        h = Math.imul(h ^ c.charCodeAt(0), 16777619);
      });
    return h >>> 0;
  }
  function escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      }[c];
    });
  }
  function spec(skill) {
    var seed = hash(skill.id),
      colors = palettes[seed % palettes.length];
    return {
      seed: seed,
      colors: colors,
      motif: Math.floor(seed / 7) % 4,
      serial: (seed % 65536).toString(16).toUpperCase().padStart(4, "0"),
    };
  }
  function svg(skill) {
    var s = spec(skill),
      bg = s.colors[0],
      ink = s.colors[1],
      accent = s.colors[2],
      art = "";
    if (s.motif === 0) {
      // Offset concentric lines read like a machined, sculptural object.
      for (var i = 0; i < 24; i++) {
        var r = 85 - i * 2.5;
        art +=
          '<ellipse cx="' +
          (181 + i * 1.1) +
          '" cy="' +
          (176 - i * 0.65) +
          '" rx="' +
          r +
          '" ry="' +
          r * 0.76 +
          '" fill="none" stroke="' +
          ink +
          '" stroke-width="1" opacity="' +
          (0.18 + i * 0.022) +
          '" transform="rotate(-32 190 170)"/>';
      }
      art += '<circle cx="180" cy="176" r="24" fill="' + accent + '"/>';
    } else if (s.motif === 1) {
      for (var j = 0; j < 19; j++) {
        var x = 75 + j * 11;
        art +=
          '<path d="M' +
          x +
          " 83 L" +
          (x - 30) +
          " 224 L" +
          (x + 35) +
          " 245 L" +
          (x + 59) +
          ' 109 Z" fill="' +
          (j % 3 === 0 ? accent : ink) +
          '" fill-opacity=".06" stroke="' +
          ink +
          '" stroke-opacity=".38" stroke-width=".7"/>';
      }
    } else if (s.motif === 2) {
      art += '<circle cx="183" cy="168" r="89" fill="' + accent + '"/>';
      for (var k = 0; k < 17; k++) {
        art +=
          '<path d="M70 ' +
          (97 + k * 10) +
          ' H293" stroke="' +
          bg +
          '" stroke-width="' +
          (2 + k * 0.16) +
          '"/>';
      }
      art +=
        '<circle cx="238" cy="117" r="30" fill="' +
        bg +
        '"/><path d="M81 260 L289 67" stroke="' +
        ink +
        '" stroke-width=".7"/>';
    } else {
      for (var n = 0; n < 12; n++) {
        art +=
          '<rect x="' +
          (99 + n * 3.5) +
          '" y="' +
          (81 + n * 3.5) +
          '" width="' +
          (172 - n * 7) +
          '" height="' +
          (172 - n * 7) +
          '" rx="' +
          n * 3 +
          '" transform="rotate(' +
          n * 4 +
          ' 185 167)" fill="none" stroke="' +
          (n % 3 ? ink : accent) +
          '" stroke-opacity=".58" stroke-width="1"/>';
      }
    }
    var name = String(skill.name || "Skills")
      .replace(/[-_]/g, " ")
      .slice(0, 24);
    var owner = String(skill.owner || "OPEN SOURCE").slice(0, 31);
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 360 360" role="img" aria-label="' +
      escape(name) +
      ' 的生成封面">' +
      '<rect width="360" height="360" fill="' +
      bg +
      '"/>' +
      '<g fill="' +
      ink +
      '" font-family="Arial, sans-serif"><text x="23" y="30" font-size="8" letter-spacing="2.3">SKILL ATLAS / OPEN ARCHIVE</text><text x="337" y="30" font-size="8" text-anchor="end">' +
      s.serial +
      "</text></g>" +
      '<path d="M23 45H337" stroke="' +
      ink +
      '" stroke-opacity=".28" stroke-width=".7"/>' +
      art +
      '<g fill="' +
      ink +
      '" font-family="Arial, sans-serif"><text x="23" y="308" font-weight="600" font-size="' +
      (name.length > 18 ? 20 : 25) +
      '" letter-spacing="-.8">' +
      escape(name) +
      '</text><text x="24" y="332" font-size="9" letter-spacing="1.2">' +
      escape(owner.toUpperCase()) +
      '</text><text x="337" y="332" text-anchor="end" font-size="9">↗</text></g></svg>'
    );
  }
  return { svg: svg, spec: spec };
});
