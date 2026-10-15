/* Shared, dependency-free directory logic. Also loaded by node --test. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SkillAtlas = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var CATEGORIES = {
    编程开发: { icon: "code", color: "#5f85bd", bg: "#eef3fc" },
    设计创意: { icon: "palette", color: "#a38ac0", bg: "#f4eff9" },
    效率工具: { icon: "bolt", color: "#b69c68", bg: "#f9f4e8" },
    科研学术: { icon: "flask", color: "#7c94b9", bg: "#eff3fa" },
    文档办公: { icon: "file", color: "#709a88", bg: "#edf5f0" },
    浏览器自动化: { icon: "globe", color: "#ad916d", bg: "#f8f2e9" },
    "Agent 框架": { icon: "layers", color: "#719a8a", bg: "#eef5f1" },
    集成连接: { icon: "puzzle", color: "#7e9baf", bg: "#eef4f8" },
    数据科学: { icon: "chart", color: "#7d91bf", bg: "#f0f3fb" },
    写作内容: { icon: "pen", color: "#b18c9e", bg: "#f8eff3" },
    生物医药: { icon: "flask", color: "#7c9c89", bg: "#eff5ef" },
    其他: { icon: "grid", color: "#9b9c9c", bg: "#f3f4f4" },
  };
  var GOALS = {
    all: {
      label: "随心探索",
      icon: "compass",
      categories: [],
      query: "topic:agent-skills",
    },
    build: {
      label: "构建产品",
      icon: "code",
      categories: ["编程开发", "Agent 框架", "集成连接"],
      query: "claude skills",
    },
    create: {
      label: "设计与创作",
      icon: "palette",
      categories: ["设计创意", "写作内容"],
      query: "design agent skills",
    },
    work: {
      label: "高效工作",
      icon: "bolt",
      categories: ["效率工具", "文档办公", "浏览器自动化"],
      query: "automation agent skills",
    },
    research: {
      label: "探索与研究",
      icon: "flask",
      categories: ["科研学术", "数据科学", "生物医药"],
      query: "research agent skills",
    },
  };
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function safeUrl(value, fallback) {
    try {
      var url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:")
        return url.href;
    } catch (_) {}
    return fallback || "";
  }
  function validId(value) {
    return (
      typeof value === "string" &&
      /^[a-z\d](?:[a-z\d-]{0,38})\/[a-z\d_.-]{1,100}$/i.test(value) &&
      !/\/(?:\.|\.\.)$/.test(value)
    );
  }
  function finite(value) {
    return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
  }
  function normalize(record) {
    if (!record || !validId(record.id || record.fullName)) return null;
    var id = record.id || record.fullName;
    var skillCount =
      record.skillCount == null ? null : finite(record.skillCount);
    return {
      id: id,
      fullName: id,
      name: String(record.name || id.split("/")[1]),
      owner: id.split("/")[0],
      url: "https://github.com/" + id,
      homepage: safeUrl(record.homepage),
      description: String(record.description || "").slice(0, 4000),
      category: Object.prototype.hasOwnProperty.call(
        CATEGORIES,
        record.category,
      )
        ? record.category
        : "其他",
      topics: Array.isArray(record.topics)
        ? record.topics
            .filter(function (t) {
              return typeof t === "string";
            })
            .slice(0, 30)
        : [],
      language: String(record.language || "").slice(0, 80),
      license: String(record.license || ""),
      stars: finite(record.stars),
      forks: finite(record.forks),
      skillCount: skillCount,
      verified: !!record.verified && skillCount > 0,
      verifiedSource: String(record.verifiedSource || ""),
      verifiedAt: record.verifiedAt || null,
      skillSignal: !!record.skillSignal || skillCount > 0,
      createdAt: record.createdAt || null,
      pushedAt: record.pushedAt || null,
      observedAt: record.observedAt || null,
      starGrowth: normalizeGrowth(record.starGrowth),
      defaultBranch: String(record.defaultBranch || ""),
      archived: !!record.archived,
      starsPerDay: finite(record.starsPerDay),
      trendScore: finite(record.trendScore),
      avatar: safeUrl(record.avatar),
      live: !!record.live,
    };
  }
  function normalizeGrowth(growth) {
    if (
      !growth ||
      !Number.isInteger(growth.delta) ||
      !Number.isInteger(growth.baselineStars) ||
      growth.baselineStars < 0
    )
      return null;
    var start = Date.parse(growth.baselineAt),
      end = Date.parse(growth.observedAt);
    var hours = (end - start) / 3600000;
    if (
      !Number.isFinite(hours) ||
      hours < 21 ||
      hours > 27 ||
      growth.baselineStars + growth.delta < 0
    )
      return null;
    return {
      delta: growth.delta,
      baselineStars: growth.baselineStars,
      percent: growth.baselineStars
        ? (growth.delta / growth.baselineStars) * 100
        : null,
      baselineAt: new Date(start).toISOString(),
      observedAt: new Date(end).toISOString(),
      hours: hours,
    };
  }
  function growthRanking(list, limit, now) {
    now = now || Date.now();
    return sortSkills(
      list.filter(function (skill) {
        var growth = skill.starGrowth;
        var age = growth ? now - Date.parse(growth.observedAt) : Infinity;
        return (
          skill.skillSignal &&
          !skill.archived &&
          growth &&
          growth.delta > 0 &&
          age >= -300000 &&
          age <= 6 * 3600000
        );
      }),
      "growth",
    ).slice(0, limit || 30);
  }
  var SYNONYMS = {
    前端: ["frontend", "front-end", "react", "vue", "前端"],
    设计: ["design", "figma", "设计创意"],
    写作: ["writing", "writer", "写作内容"],
    研究: ["research", "科研学术"],
    自动化: ["automation", "automate", "浏览器自动化", "效率工具"],
    编程: ["coding", "code", "编程开发"],
    办公: ["office", "文档办公", "spreadsheet", "docx", "pptx"],
  };
  function queryTokens(query) {
    return (
      String(query || "")
        .toLowerCase()
        .match(/(?:[^\s"]+|"[^"]*")+/g) || []
    )
      .map(function (part) {
        var exclude = part.charAt(0) === "-";
        if (exclude) part = part.slice(1);
        var fieldMatch = part.match(/^(owner|topic|lang|language|category):/);
        var field = fieldMatch ? fieldMatch[1] : "";
        if (field) part = part.slice(fieldMatch[0].length);
        return {
          field: field,
          value: part.replace(/"/g, ""),
          exclude: exclude,
        };
      })
      .filter(function (token) {
        return token.value;
      });
  }
  function searchText(skill) {
    return [
      skill.name,
      skill.fullName,
      skill.description,
      skill.category,
      skill.language,
      (skill.topics || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
  }
  function matchesTokens(skill, tokens) {
    var text;
    return tokens.every(function (token) {
      var haystack;
      if (token.field === "owner") haystack = String(skill.owner).toLowerCase();
      else if (token.field === "topic")
        haystack = (skill.topics || []).join(" ").toLowerCase();
      else if (token.field === "lang" || token.field === "language")
        haystack = String(skill.language).toLowerCase();
      else if (token.field === "category")
        haystack = String(skill.category).toLowerCase();
      else {
        if (!text) text = searchText(skill);
        haystack = text;
      }
      var words =
        !token.field &&
        Object.prototype.hasOwnProperty.call(SYNONYMS, token.value)
          ? SYNONYMS[token.value]
          : [token.value];
      var match = words.some(function (word) {
        return haystack.indexOf(word) !== -1;
      });
      return token.exclude ? !match : match;
    });
  }
  function time(value) {
    return Date.parse(value) || 0;
  }
  function recommendationScore(skill, goal, now) {
    var categories = (
      Object.prototype.hasOwnProperty.call(GOALS, goal)
        ? GOALS[goal]
        : GOALS.all
    ).categories;
    var age = Math.max(
      0,
      ((now || Date.now()) - time(skill.pushedAt)) / 86400000,
    );
    return (
      (categories.indexOf(skill.category) !== -1 ? 65 : 0) +
      (skill.verified ? 30 : 0) +
      (skill.skillSignal ? 10 : 0) +
      Math.log10(skill.stars + 1) * 5 +
      Math.max(0, 8 - age / 14) -
      (skill.archived ? 100 : 0)
    );
  }
  function sortSkills(list, sort, goal) {
    var now = Date.now();
    return list.slice().sort(function (a, b) {
      var diff;
      if (sort === "stars") diff = b.stars - a.stars;
      else if (sort === "growth")
        diff =
          (b.starGrowth ? b.starGrowth.delta : -Infinity) -
          (a.starGrowth ? a.starGrowth.delta : -Infinity);
      else if (sort === "recent") diff = time(b.pushedAt) - time(a.pushedAt);
      else if (sort === "new") diff = time(b.createdAt) - time(a.createdAt);
      else if (sort === "skills")
        diff = (b.skillCount || 0) - (a.skillCount || 0);
      else if (sort === "name")
        diff = a.fullName.localeCompare(b.fullName, "en", {
          sensitivity: "base",
        });
      else if (sort === "trend") diff = b.trendScore - a.trendScore;
      else
        diff =
          recommendationScore(b, goal, now) - recommendationScore(a, goal, now);
      return diff || b.stars - a.stars || a.id.localeCompare(b.id);
    });
  }
  function filterSkills(list, filters) {
    var tokens = queryTokens(filters.q);
    return sortSkills(
      list.filter(function (skill) {
        return (
          (!filters.cat || skill.category === filters.cat) &&
          (!filters.verifiedOnly || skill.verified) &&
          (!filters.skillOnly || skill.skillSignal) &&
          (!filters.language || skill.language === filters.language) &&
          matchesTokens(skill, tokens)
        );
      }),
      filters.sort || "recommended",
      filters.goal,
    );
  }
  function mergeSkills(snapshot, live) {
    var merged = new Map(
      snapshot.map(function (skill) {
        return [skill.id.toLowerCase(), skill];
      }),
    );
    live.forEach(function (skill) {
      var previous = merged.get(skill.id.toLowerCase());
      if (previous && time(previous.observedAt) > time(skill.observedAt))
        return;
      merged.set(
        skill.id.toLowerCase(),
        previous
          ? Object.assign({}, previous, skill, {
              skillCount: previous.skillCount,
              verified: previous.verified,
              verifiedAt: previous.verifiedAt,
              verifiedSource: previous.verifiedSource,
              skillSignal: previous.skillSignal || skill.skillSignal,
              starGrowth: previous.starGrowth,
            })
          : skill,
      );
    });
    return Array.from(merged.values());
  }
  function classify(text) {
    var rules = [
      ["文档办公", /\b(docx|pptx|xlsx|office|spreadsheet|pdf)\b/i],
      ["生物医药", /\b(protein|medical|genomic|biology)\b/i],
      ["科研学术", /research|arxiv|academic|citation/i],
      ["浏览器自动化", /browser|playwright|puppeteer|selenium|scrap/i],
      ["设计创意", /\b(design|figma|image|video|creative|ui|ux)\b/i],
      ["数据科学", /\b(data|analytics|sql|chart|pandas)\b/i],
      ["集成连接", /\b(mcp|integration|connector)\b/i],
      ["编程开发", /\b(code|coding|developer|typescript|python|test)\b/i],
      ["写作内容", /writing|writer|content|translate/i],
      ["效率工具", /automation|productivity|workflow/i],
    ];
    for (var i = 0; i < rules.length; i++)
      if (rules[i][1].test(text)) return rules[i][0];
    return "Agent 框架";
  }
  function normalizeLive(repo) {
    if (!repo || !validId(repo.full_name)) return null;
    var text = [
      repo.name,
      repo.description,
      (repo.topics || []).join(" "),
    ].join(" ");
    var age = Math.max(1, (Date.now() - time(repo.created_at)) / 86400000);
    var stars = finite(repo.stargazers_count),
      forks = finite(repo.forks_count);
    var pushed = Math.max(0.2, (Date.now() - time(repo.pushed_at)) / 86400000);
    return normalize({
      id: repo.full_name,
      name: repo.name,
      description: repo.description,
      homepage: repo.homepage,
      category: classify(text),
      topics: repo.topics,
      language: repo.language,
      license: (repo.license || {}).spdx_id,
      stars: stars,
      forks: forks,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      observedAt: new Date().toISOString(),
      defaultBranch: repo.default_branch,
      skillSignal: /\bskills?\b|agent[-_]skill/i.test(text),
      starsPerDay: stars / age,
      trendScore:
        stars * 0.45 +
        (stars / age) * 55 +
        forks * 0.5 +
        25 / (1 + pushed / 21),
      avatar: (repo.owner || {}).avatar_url,
      archived: repo.archived,
      live: true,
    });
  }
  function dailyPicks(list, goal, offset, date) {
    var candidates = sortSkills(
      list.filter(function (skill) {
        return skill.verified && !skill.archived;
      }),
      "recommended",
      goal,
    );
    var preferred = (
      Object.prototype.hasOwnProperty.call(GOALS, goal)
        ? GOALS[goal]
        : GOALS.all
    ).categories;
    if (preferred.length) {
      var relevant = candidates.filter(function (skill) {
        return preferred.indexOf(skill.category) !== -1;
      });
      if (relevant.length >= 3) candidates = relevant;
    }
    // Rotate within a relevant, high quality pool, rather than over the entire index.
    candidates = candidates.slice(0, 36);
    if (!candidates.length) return [];
    var moment = date || new Date();
    var day = Math.floor(
      Date.UTC(moment.getFullYear(), moment.getMonth(), moment.getDate()) /
        86400000,
    );
    var start =
      (((day + (offset || 0) * 3) % candidates.length) + candidates.length) %
      candidates.length;
    var picks = [],
      owners = new Set();
    for (var i = 0; i < candidates.length && picks.length < 3; i++) {
      var candidate = candidates[(start + i) % candidates.length];
      if (!owners.has(candidate.owner)) {
        picks.push(candidate);
        owners.add(candidate.owner);
      }
    }
    for (
      var j = 0;
      j < candidates.length && picks.length < Math.min(3, candidates.length);
      j++
    ) {
      var fallback = candidates[(start + j) % candidates.length];
      if (picks.indexOf(fallback) === -1) picks.push(fallback);
    }
    return picks;
  }
  async function checkPublishedSnapshot(endpoint, currentMeta, fetcher) {
    fetcher = fetcher || fetch;
    var source = safeUrl(endpoint);
    if (!source) throw new Error("Invalid snapshot endpoint");
    var metadataUrl = new URL(source);
    metadataUrl.pathname = metadataUrl.pathname.replace(/[^/]+$/, "meta.json");
    var controller = new AbortController();
    var timeout = setTimeout(function () {
      controller.abort();
    }, 15000);
    try {
      var options = { signal: controller.signal, cache: "no-cache" };
      var response = await fetcher(metadataUrl.href, options);
      if (!response.ok) throw new Error("Snapshot metadata unavailable");
      var meta = await response.json();
      if (!meta || !Number.isFinite(Date.parse(meta.generatedAt)))
        throw new Error("Invalid snapshot metadata");
      if (time(meta.generatedAt) <= time((currentMeta || {}).generatedAt))
        return { changed: false, meta: meta };
      response = await fetcher(source, options);
      if (!response.ok) throw new Error("Snapshot unavailable");
      var payload = await response.json();
      if (
        !payload ||
        !payload.meta ||
        time(payload.meta.generatedAt) < time(meta.generatedAt) ||
        !Array.isArray(payload.skills) ||
        !payload.skills.length ||
        payload.skills.length > 50000
      )
        throw new Error("Snapshot is incomplete or older than its metadata");
      var skills = payload.skills.map(normalize);
      if (
        skills.some(function (skill) {
          return !skill;
        }) ||
        new Set(
          skills.map(function (skill) {
            return skill.id.toLowerCase();
          }),
        ).size !== skills.length ||
        (payload.meta.reposKept != null &&
          payload.meta.reposKept !== skills.length)
      )
        throw new Error("Invalid snapshot records");
      return { changed: true, meta: payload.meta, skills: skills };
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    CATEGORIES: CATEGORIES,
    GOALS: GOALS,
    esc: esc,
    safeUrl: safeUrl,
    validId: validId,
    normalize: normalize,
    normalizeLive: normalizeLive,
    queryTokens: queryTokens,
    filterSkills: filterSkills,
    sortSkills: sortSkills,
    mergeSkills: mergeSkills,
    recommendationScore: recommendationScore,
    dailyPicks: dailyPicks,
    growthRanking: growthRanking,
    normalizeGrowth: normalizeGrowth,
    checkPublishedSnapshot: checkPublishedSnapshot,
  };
});
