/* SkillAtlas — offline-first UI with automatic published snapshot checks. */
(function () {
  "use strict";
  var C = window.SkillAtlas;
  var $ = function (selector) {
    return document.querySelector(selector);
  };
  var esc = C.esc;
  var owns = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  };
  var PAGE_SIZE = 24;
  var VIEWS = {
    discover: "发现灵感",
    browse: "全部 Skills",
    ranking: "今日涨星",
    saved: "我的收藏",
    about: "关于与数据来源",
  };
  var PATHS = {
    compass:
      '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    trend: '<path d="m3 17 6-6 4 4 8-10M15 5h6v6"/>',
    bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16"/>',
    palette:
      '<path d="M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 1.5-3.3 1.5 1.5 0 0 1 1-2.5h2A4 4 0 0 0 21 11a9 9 0 0 0-9-8Z"/><path d="M7 11h.01M9 7h.01M14 6h.01M18 10h.01" stroke-width="2.8"/>',
    flask:
      '<path d="M9 3h6M10 3v6l-6 10a1.3 1.3 0 0 0 1.2 2h13.6a1.3 1.3 0 0 0 1.2-2L14 9V3M8 14h8"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Zm0 0v5h5M9 12h6M9 16h6"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    puzzle:
      '<path d="M4 4h5a3 3 0 1 1 6 0h5v5a3 3 0 1 0 0 6v5h-5a3 3 0 1 0-6 0H4v-5a3 3 0 1 1 0-6Z"/>',
    chart: '<path d="M4 3v17h17M8 16v-5m5 5V7m5 9V4"/>',
    pen: '<path d="m16 3 5 5-12 12-6 1 1-6Zm-10 13 3 3M14 5l5 5"/>',
    github:
      '<path d="M9 19c-4 1-4-2-6-2m12 5v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6A4.7 4.7 0 0 0 18.5 7a4.3 4.3 0 0 0-.1-3.3S17.3 3.4 15 5a12 12 0 0 0-6 0C6.7 3.4 5.6 3.7 5.6 3.7A4.3 4.3 0 0 0 5.5 7a4.7 4.7 0 0 0-1.3 3.3c0 4.7 2.9 5.7 5.6 6a3 3 0 0 0-.8 2.3V22"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    external:
      '<path d="M14 3h7v7m0-7L11 13m-1-8H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
    refresh:
      '<path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5m-4 9a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    list: '<path d="M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01"/>',
    link: '<path d="m10 13 4-4M8 16l-1 1a3.5 3.5 0 0 1-5-5l5-5a3.5 3.5 0 0 1 5 0m0 10a3.5 3.5 0 0 0 5 0l5-5a3.5 3.5 0 0 0-5-5l-1 1"/>',
    star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    sparkles:
      '<path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8ZM20 2v4m-2-2h4M3 19v4m-2-2h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cloud:
      '<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11ZM9 12l6 6m0-6-6 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 15v5h16v-5"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  };
  function icon(name) {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      (PATHS[name] || PATHS.grid) +
      "</svg>"
    );
  }
  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      el.innerHTML = icon(el.dataset.icon);
    });
  }
  function readStore(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }
  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }
  var profile = readStore("skillatlas-profile", {});
  if (!profile || typeof profile !== "object") profile = {};
  var storedSaved = readStore("skillatlas-saved", []);
  var saved = new Map();
  if (Array.isArray(storedSaved))
    storedSaved.slice(0, 5000).forEach(function (item) {
      var skill = C.normalize(item);
      if (skill) saved.set(skill.id.toLowerCase(), skill);
    });
  var state = {
    snapshot: [],
    skills: [],
    meta: {},
    view: "discover",
    q: "",
    cat: "",
    sort: "recommended",
    language: "",
    verifiedOnly: false,
    skillOnly: false,
    page: 1,
    rank: "growth",
    goal: owns(C.GOALS, profile.goal) ? profile.goal : "all",
    layout: profile.layout === "list" ? "list" : "grid",
    dailyOffset: 0,
    live: [],
    lastSync: 0,
    syncBusy: false,
    detailId: null,
    ready: false,
  };
  var lookup = new Map(),
    fileCache = new Map(),
    searchTimer,
    toastTimer,
    detailRequest;
  var previousFocus;
  var sharedRequest;
  var snapshotBusy = false,
    lastSnapshotCheck = 0;
  var AUTO_CHECK_INTERVAL = 15 * 60 * 1000;
  function exact(n) {
    return Number(n || 0).toLocaleString("en-US");
  }
  function compact(n) {
    return n >= 1000000
      ? (n / 1000000).toFixed(1) + "m"
      : n >= 1000
        ? (n / 1000).toFixed(1) + "k"
        : String(n || 0);
  }
  function dateLabel(iso) {
    var date = new Date(iso);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "日期未知";
  }
  function ago(iso) {
    var days = Math.max(0, (Date.now() - Date.parse(iso)) / 86400000);
    if (!Number.isFinite(days)) return "日期未知";
    if (days < 1) return "今天";
    if (days < 30) return Math.floor(days) + " 天前";
    if (days < 365) return Math.floor(days / 30) + " 个月前";
    return Math.floor(days / 365) + " 年前";
  }
  function toast(message) {
    clearTimeout(toastTimer);
    var dialogStatus = $("#detailStatus");
    if (dialogStatus) dialogStatus.hidden = true;
    $("#toast").classList.remove("show");
    var target =
      $("#detailDialog").open && dialogStatus ? dialogStatus : $("#toast");
    target.textContent = message;
    target.hidden = false;
    target.classList.add("show");
    toastTimer = setTimeout(function () {
      target.classList.remove("show");
      if (target === dialogStatus) target.hidden = true;
    }, 2800);
  }
  function avatar(skill, small) {
    var url = C.safeUrl(skill.avatar);
    return (
      '<span class="repo-avatar' +
      (small ? " small" : "") +
      '"><span aria-hidden="true">' +
      esc(skill.owner.charAt(0).toUpperCase()) +
      "</span>" +
      (url
        ? '<img src="' +
          esc(url) +
          '" alt="" loading="lazy" referrerpolicy="no-referrer" />'
        : "") +
      "</span>"
    );
  }
  // Image failure keeps the locally rendered initial visible, including offline.
  document.addEventListener(
    "error",
    function (event) {
      if (event.target.tagName === "IMG") event.target.hidden = true;
    },
    true,
  );
  function isSaved(id) {
    return saved.has(id.toLowerCase());
  }
  function saveButton(skill) {
    var active = isSaved(skill.id);
    return (
      '<button class="icon-button save-button' +
      (active ? " saved" : "") +
      '" data-save="' +
      esc(skill.id) +
      '" aria-pressed="' +
      active +
      '" aria-label="' +
      (active ? "取消收藏 " : "收藏 ") +
      esc(skill.name) +
      '" title="' +
      (active ? "取消收藏" : "收藏到工具箱") +
      '">' +
      icon("bookmark") +
      "</button>"
    );
  }
  function badge(skill) {
    return skill.verified
      ? '<span class="tag verified" title="仅核验文件存在性，不代表质量或安全审查">' +
          icon("check") +
          " " +
          exact(skill.skillCount) +
          " 个技能文件</span>"
      : '<span class="tag">' +
          (skill.skillCount === 0 ? "未发现 SKILL.md" : "文件待核验") +
          "</span>";
  }
  function card(skill, featured, index) {
    var goal = C.GOALS[state.goal],
      relevant = goal.categories.indexOf(skill.category) !== -1;
    var reasons = [
      relevant ? "与你的目标有关" : "从这里开始探索",
      "把好工具加入日常",
      "留一点空间给灵感",
    ];
    return (
      '<article class="skill-card' +
      (featured ? " featured-card" : "") +
      '">' +
      (featured
        ? '<div class="featured-label">' +
          icon(index === 0 ? "sparkles" : index === 1 ? "layers" : "compass") +
          esc(reasons[index]) +
          "</div>"
        : "") +
      '<div class="card-top">' +
      avatar(skill) +
      '<div class="card-name"><button class="card-title" data-open="' +
      esc(skill.id) +
      '" title="' +
      esc(skill.name) +
      '">' +
      esc(skill.name) +
      '</button><span class="card-owner">' +
      esc(skill.owner) +
      "</span></div></div>" +
      saveButton(skill) +
      '<p class="card-description" title="' +
      esc(skill.description) +
      '">' +
      esc(skill.description || "作者还没有填写描述。打开仓库了解更多。") +
      "</p>" +
      '<div class="card-tags"><button class="tag" data-category="' +
      esc(skill.category) +
      '">' +
      esc(skill.category) +
      "</button>" +
      badge(skill) +
      (skill.archived ? '<span class="tag archived">已归档</span>' : "") +
      "</div>" +
      '<div class="card-footer"><span class="star-count" title="' +
      exact(skill.stars) +
      ' 个星标">' +
      icon("star") +
      compact(skill.stars) +
      "</span><span>" +
      (skill.live ? "刚刚同步" : "更新于 " + ago(skill.pushedAt)) +
      '</span><button class="card-open" data-open="' +
      esc(skill.id) +
      '" aria-label="了解 ' +
      esc(skill.name) +
      '">了解更多 ' +
      icon("arrow") +
      "</button></div></article>"
    );
  }
  function rebuildIndex() {
    state.skills = C.mergeSkills(state.snapshot, state.live);
    lookup = new Map(
      state.skills.map(function (skill) {
        return [skill.id.toLowerCase(), skill];
      }),
    );
    saved.forEach(function (skill, id) {
      if (!lookup.has(id)) lookup.set(id, skill);
    });
  }
  function getSkill(id) {
    return typeof id === "string" ? lookup.get(id.toLowerCase()) : null;
  }
  function categoryCounts(list) {
    var counts = {};
    list.forEach(function (s) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }
  function persistProfile() {
    writeStore("skillatlas-profile", {
      goal: state.goal,
      layout: state.layout,
    });
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    $("#themeToggle").innerHTML = icon(theme === "dark" ? "moon" : "sun");
    $("#themeToggle").setAttribute(
      "aria-label",
      theme === "dark" ? "切换浅色外观" : "切换深色外观",
    );
  }
  function setMobileMenu(open) {
    $("#sidebar").classList.toggle("is-open", open);
    $("#sidebarBackdrop").hidden = !open;
    $("#menuButton").setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    $("#sidebar").inert = window.innerWidth <= 760 && !open;
    $("#content").inert = open;
    if (open) $("#sidebar .brand").focus();
  }
  function currentUrl(detailId) {
    var url = new URL(location.href);
    url.search = "";
    url.hash = "";
    if (state.view !== "discover") url.searchParams.set("view", state.view);
    if (state.q) url.searchParams.set("q", state.q);
    if (state.cat) url.searchParams.set("cat", state.cat);
    if (state.language) url.searchParams.set("lang", state.language);
    if (state.verifiedOnly) url.searchParams.set("verified", "1");
    if (state.skillOnly) url.searchParams.set("skills", "1");
    if (state.sort !== "recommended") url.searchParams.set("sort", state.sort);
    if (state.goal !== "all") url.searchParams.set("goal", state.goal);
    if (state.view === "ranking" && state.rank !== "growth")
      url.searchParams.set("rank", state.rank);
    if (detailId) url.searchParams.set("skill", detailId);
    return url;
  }
  function syncUrl(push) {
    try {
      history[push ? "pushState" : "replaceState"](
        {},
        "",
        currentUrl(state.detailId),
      );
    } catch (_) {}
  }
  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.q = (p.get("q") || "").slice(0, 300);
    state.cat = owns(C.CATEGORIES, p.get("cat")) ? p.get("cat") : "";
    state.language = p.get("lang") || "";
    state.verifiedOnly = p.get("verified") === "1";
    state.skillOnly = p.get("skills") === "1";
    state.sort =
      ["recommended", "stars", "recent", "new", "skills", "name"].indexOf(
        p.get("sort"),
      ) !== -1
        ? p.get("sort")
        : "recommended";
    state.rank =
      ["growth", "trend", "stars", "recent", "skills"].indexOf(
        p.get("rank"),
      ) !== -1
        ? p.get("rank")
        : "growth";
    if (owns(C.GOALS, p.get("goal"))) state.goal = p.get("goal");
    state.view = owns(VIEWS, p.get("view"))
      ? p.get("view")
      : state.q ||
          state.cat ||
          state.language ||
          state.verifiedOnly ||
          state.skillOnly
        ? "browse"
        : "discover";
    state.page = 1;
    return p.get("skill");
  }
  function resetFilters() {
    state.q = "";
    state.cat = "";
    state.language = "";
    state.verifiedOnly = false;
    state.skillOnly = false;
    state.sort = "recommended";
    state.page = 1;
  }
  function navigate(view, reset) {
    if (!state.ready || !owns(VIEWS, view)) return;
    clearTimeout(searchTimer);
    var changed = state.view !== view;
    if (reset) resetFilters();
    state.view = view;
    state.page = 1;
    setMobileMenu(false);
    renderCurrent();
    syncUrl(changed);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function renderChrome() {
    var counts = categoryCounts(state.skills);
    $("#navTotal").textContent = exact(state.skills.length);
    $("#savedCount").textContent = exact(saved.size);
    $("#viewLabel").textContent = VIEWS[state.view];
    document.title = VIEWS[state.view] + " · SkillAtlas";
    document
      .querySelectorAll(".sidebar [data-view]")
      .forEach(function (button) {
        var active = button.dataset.view === state.view;
        button.classList.toggle("active", active);
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
    $("#categoryNav").innerHTML = [
      "编程开发",
      "设计创意",
      "效率工具",
      "科研学术",
      "文档办公",
      "浏览器自动化",
    ]
      .map(function (cat) {
        return (
          '<button data-category="' +
          cat +
          '" class="' +
          (state.cat === cat && state.view === "browse" ? "active" : "") +
          '"><span class="cat-bullet" style="--cat:' +
          C.CATEGORIES[cat].color +
          '"></span>' +
          cat +
          "</button>"
        );
      })
      .join("");
    $("#searchInput").value = state.q;
    $("#footerStamp").textContent =
      "数据快照 " +
      new Date(state.meta.generatedAt).toLocaleString("zh-CN", {
        hour12: false,
      });
    $("#goalChoices").innerHTML = Object.keys(C.GOALS)
      .map(function (key) {
        return (
          '<button class="intent-option' +
          (state.goal === key ? " active" : "") +
          '" data-goal="' +
          key +
          '" aria-pressed="' +
          (state.goal === key) +
          '">' +
          icon(C.GOALS[key].icon) +
          C.GOALS[key].label +
          "</button>"
        );
      })
      .join("");
    return counts;
  }
  function renderDiscover() {
    var counted = state.snapshot.reduce(function (sum, s) {
      return sum + (s.skillCount || 0);
    }, 0);
    $("#heroProof").innerHTML =
      icon("shield") +
      "<b>" +
      exact(state.snapshot.length) +
      "</b> 个开源仓库 <span>·</span> <b>" +
      exact(counted) +
      "</b> 个已发现技能文件";
    var age = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(state.meta.generatedAt)) / 86400000),
    );
    $("#snapshotLabel").textContent =
      "数据快照 " +
      dateLabel(state.meta.generatedAt) +
      (Number.isFinite(age) && age > 1 ? " · " + age + " 天前采集" : "") +
      (state.live.length ? " · 已合并本次同步" : "");
    $("#recommendNote").textContent =
      state.goal === "all"
        ? "从已发现 SKILL.md 的仓库里，为你挑选。"
        : "围绕「" +
          C.GOALS[state.goal].label +
          "」挑选，优先展示已发现技能文件的仓库。";
    var picks = C.dailyPicks(state.skills, state.goal, state.dailyOffset);
    $("#featuredGrid").innerHTML = picks.length
      ? picks
          .map(function (s, i) {
            return card(s, true, i);
          })
          .join("")
      : '<p class="empty-state">暂时没有已核验的推荐，试试探索全部仓库。</p>';
    var counts = categoryCounts(state.skills);
    $("#categoryGrid").innerHTML = [
      "编程开发",
      "设计创意",
      "文档办公",
      "科研学术",
      "浏览器自动化",
      "Agent 框架",
      "数据科学",
      "集成连接",
    ]
      .map(function (name) {
        var cat = C.CATEGORIES[name];
        return (
          '<button class="category-tile" data-category="' +
          name +
          '"><span class="category-icon" style="--cat:' +
          cat.color +
          ";--cat-bg:" +
          cat.bg +
          '">' +
          icon(cat.icon) +
          "</span><span><b>" +
          name +
          "</b><small>" +
          exact(counts[name] || 0) +
          " 个开源仓库</small></span>" +
          icon("arrow") +
          "</button>"
        );
      })
      .join("");
    $("#recentList").innerHTML = C.sortSkills(
      state.skills.filter(function (s) {
        return !s.archived;
      }),
      "recent",
    )
      .slice(0, 4)
      .map(function (s) {
        return (
          '<article class="recent-row">' +
          avatar(s, true) +
          '<div class="recent-copy"><button data-open="' +
          esc(s.id) +
          '">' +
          esc(s.name) +
          "</button><small>" +
          esc(s.owner) +
          '</small></div><span class="tag">' +
          esc(s.category) +
          "</span><span>" +
          ago(s.pushedAt) +
          '更新</span><button data-open="' +
          esc(s.id) +
          '" aria-label="查看 ' +
          esc(s.name) +
          '">' +
          icon("arrow") +
          "</button></article>"
        );
      })
      .join("");
    renderDailyGrowthPreview();
  }
  function renderDailyGrowthPreview() {
    var leaders = C.growthRanking(state.skills, 3);
    $("#dailyGrowthPreview").innerHTML = leaders.length
      ? leaders
          .map(function (skill) {
            return (
              '<article class="recent-row">' +
              avatar(skill, true) +
              '<div class="recent-copy"><button data-open="' +
              esc(skill.id) +
              '">' +
              esc(skill.name) +
              "</button><small>" +
              esc(skill.owner) +
              '</small></div><span class="growth-value">+' +
              exact(skill.starGrowth.delta) +
              ' ★</span><button data-open="' +
              esc(skill.id) +
              '" aria-label="查看 ' +
              esc(skill.name) +
              '">' +
              icon("arrow") +
              "</button></article>"
            );
          })
          .join("")
      : '<div class="growth-warming"><span>' +
        icon("chart") +
        "</span><div><b>" +
        growthEmptyTitle() +
        "</b><p>" +
        growthEmptyDescription() +
        "</p></div></div>";
  }
  function growthEmptyTitle() {
    var growth = state.meta.growth || {};
    if (
      Date.now() - Date.parse(state.meta.generatedAt) > 6 * 3600000 &&
      growth.status === "ready"
    )
      return "等待新一轮星标观测";
    return growth.comparableRepos
      ? "本轮暂无符合条件的正增长 Skills"
      : "星标基线积累中";
  }
  function growthEmptyDescription() {
    return (state.meta.growth || {}).comparableRepos
      ? "当前没有同时满足数据时效、Skills 线索和正增长条件的仓库。下一轮采集后会自动重新计算。"
      : "后台持续保存真实星标。首次运行约一天后，具备完整对比样本的 Skills 会自动进入今日榜单。";
  }
  function renderCatalog() {
    var isCollection = state.view === "saved";
    $("#catalogTitle").textContent = isCollection
      ? "好工具，留给下一次灵感"
      : "一整个世界的可能";
    $("#catalogEyebrow").textContent = isCollection
      ? "YOUR LITTLE TOOLBOX"
      : "THE SKILLS LIBRARY";
    $("#catalogIntro").textContent = isCollection
      ? "属于你的工具箱，收藏保存在当前浏览器。"
      : "找到适合你的工具，把精力留给创造。";
    var source = isCollection
      ? Array.from(saved.values()).map(function (skill) {
          return getSkill(skill.id) || skill;
        })
      : state.skills;
    var counts = categoryCounts(source);
    $("#categoryChips").innerHTML = [""]
      .concat(
        Object.keys(C.CATEGORIES).filter(function (name) {
          return counts[name] || state.cat === name;
        }),
      )
      .map(function (name) {
        return (
          '<button class="category-chip' +
          (state.cat === name ? " active" : "") +
          '" data-filter-cat="' +
          name +
          '" aria-pressed="' +
          (state.cat === name) +
          '">' +
          (name || "全部") +
          "<span>" +
          exact(name ? counts[name] || 0 : source.length) +
          "</span></button>"
        );
      })
      .join("");
    var languages = Array.from(
      new Set(
        source
          .map(function (s) {
            return s.language;
          })
          .filter(Boolean),
      ),
    ).sort();
    if (state.language && languages.indexOf(state.language) === -1)
      languages.push(state.language);
    $("#languageSelect").innerHTML =
      '<option value="">全部语言</option>' +
      languages
        .map(function (lang) {
          return '<option value="' + esc(lang) + '">' + esc(lang) + "</option>";
        })
        .join("");
    $("#languageSelect").value = state.language;
    $("#sortSelect").value = state.sort;
    $("#verifiedOnly").checked = state.verifiedOnly;
    $("#skillOnly").checked = state.skillOnly;
    $("#queryNote").hidden = !state.q;
    $("#queryNote").innerHTML = "正在寻找：<b>" + esc(state.q) + "</b>";
    var list = C.filterSkills(source, state);
    var shown = list.slice(0, state.page * PAGE_SIZE);
    $("#resultsCount").innerHTML =
      "找到 <b>" +
      exact(list.length) +
      "</b> 个" +
      (isCollection ? "收藏" : "仓库");
    var grid = $("#catalogGrid");
    grid.classList.toggle("list-layout", state.layout === "list");
    document.querySelectorAll("[data-layout]").forEach(function (button) {
      var active = button.dataset.layout === state.layout;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    grid.innerHTML = shown.length
      ? shown
          .map(function (s) {
            return card(s, false);
          })
          .join("")
      : '<div class="empty-state"><span class="empty-icon">' +
        icon(isCollection && !saved.size ? "bookmark" : "search") +
        "</span><h2>" +
        (isCollection && !saved.size
          ? "把下一次灵感，先放在这里"
          : "还没找到这一种可能") +
        "</h2><p>" +
        (isCollection && !saved.size
          ? "点击仓库卡片上的收藏图标，好工具就不会走散。"
          : "试试更短的关键词、切换分类，或清除当前筛选。") +
        '</p><button class="button primary" ' +
        (isCollection && !saved.size
          ? 'data-view="browse"'
          : 'data-reset="1"') +
        ">" +
        (isCollection && !saved.size ? "去发现好工具" : "清除筛选") +
        icon("arrow") +
        "</button></div>";
    $("#loadMore").hidden = shown.length >= list.length;
    $("#pageProgress").textContent = list.length
      ? "已探索 " + exact(shown.length) + " / " + exact(list.length)
      : "";
  }
  function renderRanking() {
    var daily = state.rank === "growth";
    var growth = state.meta.growth || {};
    $("#rankingTitle").textContent = daily
      ? "今日涨星最快的 Skills"
      : "被更多人发现的好工具";
    $("#rankingNotice").textContent = daily
      ? "按近 24 小时真实净增星标排序。使用间隔 21–27 小时中最接近 24 小时的两次采样，不估算缺失数据；只展示有 Skills 线索、未归档且净增为正的仓库。"
      : "综合热度使用启发式评分；日均星标是累计星标 ÷ 仓库年龄，并非最近 24 小时增长。";
    $("#growthCoverage").hidden = !daily;
    $("#growthCoverage").textContent =
      "更新于 " +
      dateLabel(state.meta.generatedAt) +
      " · 有对比样本 " +
      exact(growth.comparableRepos || 0) +
      " 个仓库 · 后台每 3 小时采集，页面自动检查更新";
    document.querySelectorAll("[data-rank]").forEach(function (button) {
      var active = state.rank === button.dataset.rank;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    var list = daily
      ? C.growthRanking(state.skills, 30)
      : C.sortSkills(state.skills, state.rank).slice(0, 30);
    if (daily && !list.length) {
      $("#rankingList").innerHTML =
        '<div class="empty-state"><span class="empty-icon">' +
        icon("chart") +
        "</span><h2>" +
        growthEmptyTitle() +
        "</h2><p>" +
        growthEmptyDescription() +
        '<br />历史样本不足或观测过期时，不使用生命周期均值代替今日涨星。</p><button class="button secondary" data-rank="trend">先看看综合热度 ' +
        icon("arrow") +
        "</button></div>";
      return;
    }
    $("#rankingList").innerHTML = list
      .map(function (s, i) {
        var value = daily
          ? "+" + exact(s.starGrowth.delta) + " ★"
          : state.rank === "skills"
            ? exact(s.skillCount) + " 个文件"
            : state.rank === "recent"
              ? ago(s.pushedAt)
              : state.rank === "stars"
                ? "☆ " + compact(s.stars)
                : exact(Math.round(s.trendScore));
        var label = daily
          ? "净增 · " + s.starGrowth.hours.toFixed(1) + " 小时"
          : state.rank === "skills"
            ? "SKILL.md"
            : state.rank === "recent"
              ? "最近提交"
              : state.rank === "stars"
                ? "累计星标"
                : "综合热度";
        return (
          '<article class="ranking-row"><span class="ranking-number">' +
          String(i + 1).padStart(2, "0") +
          '</span><div class="ranking-repo">' +
          avatar(s, true) +
          '<div><button data-open="' +
          esc(s.id) +
          '">' +
          esc(s.name) +
          "</button><small>" +
          esc(s.owner) +
          '</small></div></div><span class="tag ranking-category">' +
          esc(s.category) +
          '</span><span class="ranking-value' +
          (daily ? " growth-value" : "") +
          '"' +
          (daily
            ? ' title="' +
              esc(
                "采样从 " +
                  new Date(s.starGrowth.baselineAt).toLocaleString("zh-CN") +
                  " 至 " +
                  new Date(s.starGrowth.observedAt).toLocaleString("zh-CN"),
              ) +
              '"'
            : "") +
          ">" +
          esc(value) +
          "<small>" +
          label +
          '</small></span><span class="ranking-value ranking-files">' +
          (daily
            ? s.starGrowth.percent == null
              ? "—"
              : s.starGrowth.percent < 0.01
                ? "&lt;0.01%"
                : "+" + s.starGrowth.percent.toFixed(2) + "%"
            : s.verified
              ? exact(s.skillCount)
              : "—") +
          (daily
            ? "<small>星标涨幅</small></span>"
            : "<small>技能文件</small></span>") +
          saveButton(s) +
          "</article>"
        );
      })
      .join("");
  }
  function renderAbout() {
    var skills = state.snapshot,
      verified = skills.filter(function (s) {
        return s.verified;
      });
    var files = skills.reduce(function (sum, s) {
      return sum + (s.skillCount || 0);
    }, 0);
    $("#dataStats").innerHTML = [
      [skills.length, "快照收录仓库"],
      [verified.length, "发现技能文件的仓库"],
      [files, "已发现 SKILL.md 文件"],
      [Object.keys(categoryCounts(skills)).length, "个探索方向"],
    ]
      .map(function (row) {
        return (
          '<div class="data-stat"><strong>' +
          exact(row[0]) +
          "</strong><span>" +
          row[1] +
          "</span></div>"
        );
      })
      .join("");
    var github = verified.filter(function (s) {
      return s.verifiedSource === "github-tree";
    }).length;
    var mirror = verified.filter(function (s) {
      return s.verifiedSource === "jsdelivr";
    }).length;
    $("#verificationSummary").textContent =
      "快照中有 " +
      exact(github) +
      " 个仓库通过 GitHub 文件树核验，" +
      exact(mirror) +
      " 个通过镜像核验。不同来源和采集时间可能产生差异。";
  }
  function renderCurrent() {
    if (!state.ready) return;
    renderChrome();
    $("#discoverView").hidden = state.view !== "discover";
    $("#catalogView").hidden =
      state.view !== "browse" && state.view !== "saved";
    $("#rankingView").hidden = state.view !== "ranking";
    $("#aboutView").hidden = state.view !== "about";
    if (state.view === "discover") renderDiscover();
    else if (state.view === "browse" || state.view === "saved") renderCatalog();
    else if (state.view === "ranking") renderRanking();
    else renderAbout();
  }
  function toggleSaved(id) {
    var skill = getSkill(id);
    if (!skill) return;
    var key = skill.id.toLowerCase(),
      previous = saved.get(key),
      active = !!previous;
    if (active) saved.delete(key);
    else saved.set(key, skill);
    if (!writeStore("skillatlas-saved", Array.from(saved.values()))) {
      if (active) saved.set(key, previous);
      else saved.delete(key);
      toast("浏览器暂时无法保存收藏，请检查存储权限或导出备份。");
      return;
    }
    var focusInDialog = $("#detailDialog").open;
    renderCurrent();
    if (focusInDialog) updateDetailSave();
    else {
      var button = Array.from(document.querySelectorAll("[data-save]")).find(
        function (el) {
          return el.dataset.save === skill.id;
        },
      );
      if (button) button.focus({ preventScroll: true });
    }
    toast(active ? "已从工具箱移除" : "已收藏，下一次灵感见");
  }
  function updateDetailSave() {
    var button = $("#detailSave");
    if (!button) return;
    var active = isSaved(state.detailId);
    button.innerHTML = icon("bookmark") + (active ? "已收藏" : "收藏到工具箱");
    button.setAttribute("aria-pressed", String(active));
  }
  async function copyText(text, success) {
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(text);
      else {
        var field = document.createElement("textarea");
        field.value = text;
        field.style.cssText = "position:fixed;left:-9999px;top:0";
        var active = document.activeElement;
        ($("#detailDialog").open
          ? $("#detailDialog")
          : document.body
        ).appendChild(field);
        field.select();
        var copied = document.execCommand("copy");
        field.remove();
        if (active) active.focus({ preventScroll: true });
        if (!copied) throw new Error("copy failed");
      }
      toast(success || "已复制链接");
    } catch (_) {
      toast("浏览器未允许复制，请从地址栏或仓库页手动复制。");
    }
  }
  function openDetail(id, fromHistory) {
    var skill = getSkill(id);
    if (!skill) {
      resolveSharedSkill(id, fromHistory);
      return;
    }
    if (detailRequest) {
      detailRequest.abort();
      detailRequest = null;
    }
    if (!$("#detailDialog").open) previousFocus = document.activeElement;
    state.detailId = skill.id;
    var source =
      skill.verifiedSource === "github-tree"
        ? "GitHub 文件树"
        : skill.verifiedSource === "jsdelivr"
          ? "jsDelivr 镜像"
          : "未知来源";
    var info = skill.verified
      ? "在" +
        source +
        "中发现 " +
        exact(skill.skillCount) +
        " 个 SKILL.md。核验时间：" +
        dateLabel(skill.verifiedAt) +
        "。此标记仅表示文件存在。"
      : skill.skillCount === 0
        ? "上次完整文件索引中未发现 SKILL.md；仓库可能属于相关框架或工具，也可能在之后新增技能文件。"
        : "该仓库尚未完成技能文件核验，可以按需读取 GitHub 文件列表。";
    $("#detailBody").innerHTML =
      '<div class="detail-heading">' +
      avatar(skill) +
      '<div><h2 id="detailTitle">' +
      esc(skill.name) +
      "</h2><p>" +
      esc(skill.fullName) +
      '</p></div></div><p class="detail-description">' +
      esc(skill.description || "作者还没有填写描述。打开仓库了解更多。") +
      '</p><div class="detail-tags"><span class="tag">' +
      esc(skill.category) +
      '</span><span class="tag">' +
      esc(skill.language || "语言未标注") +
      '</span><span class="tag">' +
      esc(
        skill.license && skill.license !== "NOASSERTION"
          ? skill.license
          : "协议未明确",
      ) +
      "</span>" +
      (skill.archived ? '<span class="tag archived">已归档</span>' : "") +
      (skill.live ? '<span class="tag">热度刚刚同步</span>' : "") +
      "</div>" +
      '<div class="detail-metrics"><div class="detail-metric"><small>累计星标</small><b>' +
      exact(skill.stars) +
      '</b></div><div class="detail-metric"><small>Forks</small><b>' +
      exact(skill.forks) +
      '</b></div><div class="detail-metric"><small>日均星标 · 生命周期</small><b>' +
      skill.starsPerDay.toFixed(1) +
      '</b><em>累计星标 ÷ 仓库年龄</em></div><div class="detail-metric"><small>最近提交</small><b>' +
      ago(skill.pushedAt) +
      "</b><em>" +
      dateLabel(skill.pushedAt) +
      '</em></div></div><p class="detail-info">' +
      esc(info) +
      "</p>" +
      '<div class="detail-tags">' +
      skill.topics
        .map(function (topic) {
          return (
            '<button class="tag" data-topic="' +
            esc(topic) +
            '">' +
            esc(topic) +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="detail-actions"><a class="button primary" href="' +
      esc(skill.url) +
      '" target="_blank" rel="noopener noreferrer">打开 GitHub 仓库 ' +
      icon("external") +
      '</a><button class="button secondary" id="detailSave" data-save="' +
      esc(skill.id) +
      '"></button>' +
      (skill.homepage
        ? '<a class="button secondary" href="' +
          esc(skill.homepage) +
          '" target="_blank" rel="noopener noreferrer">项目主页 ' +
          icon("external") +
          "</a>"
        : "") +
      "</div>" +
      '<div class="detail-secondary-actions"><button class="text-button" id="shareSkill">' +
      icon("link") +
      '复制分享链接</button><button class="text-button" id="copyClone">' +
      icon("copy") +
      '复制克隆命令</button></div><p id="detailStatus" class="detail-status" role="status" aria-live="polite" hidden></p>' +
      '<section class="skill-files"><h3>里面有哪些技能？</h3><p>按需读取当前分支的 SKILL.md 路径。使用方法以仓库 README 为准。</p><div id="fileResults"><button class="button secondary" id="loadFiles">' +
      icon("file") +
      '读取技能文件列表</button><p class="file-status">需要连接 GitHub，可能受匿名 API 配额限制。</p></div></section>';
    updateDetailSave();
    if (!$("#detailDialog").open) $("#detailDialog").showModal();
    $("#detailDialog").scrollTop = 0;
    if (fileCache.has(skill.id.toLowerCase()))
      renderFiles(skill, fileCache.get(skill.id.toLowerCase()));
    if (!fromHistory) syncUrl();
  }
  function closeDetail(fromHistory) {
    if (detailRequest) {
      detailRequest.abort();
      detailRequest = null;
    }
    state.detailId = null;
    if ($("#detailDialog").open) $("#detailDialog").close();
    if (!fromHistory) syncUrl();
    if (previousFocus && previousFocus.isConnected)
      previousFocus.focus({ preventScroll: true });
  }
  async function githubJson(url, signal) {
    var response = await fetch(url, {
      signal: signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      if (response.status === 403 || response.status === 429)
        throw new Error("GitHub API 暂时不可用或匿名额度已用完，请稍后重试。");
      if (response.status === 404)
        throw new Error("仓库或默认分支暂不可用，可以直接打开 GitHub 查看。");
      throw new Error("GitHub 返回 " + response.status + "，请稍后重试。");
    }
    return response.json();
  }
  async function resolveSharedSkill(id, fromHistory) {
    if (!C.validId(id)) {
      toast("分享链接中的仓库名称无效。");
      return;
    }
    if (sharedRequest) sharedRequest.abort();
    var controller = new AbortController();
    sharedRequest = controller;
    var expectedUrl = location.href;
    var timeout = setTimeout(function () {
      controller.abort();
    }, 12000);
    toast("这个仓库还未收录，正在从 GitHub 读取…");
    try {
      var record = await githubJson(
        "https://api.github.com/repos/" + id,
        controller.signal,
      );
      var skill = C.normalizeLive(record);
      if (!skill) throw new Error("GitHub 未返回有效的仓库信息。");
      if (sharedRequest !== controller || expectedUrl !== location.href) return;
      state.live = C.mergeSkills(state.live, [skill]);
      rebuildIndex();
      renderCurrent();
      openDetail(skill.id, fromHistory);
    } catch (error) {
      if (sharedRequest !== controller || expectedUrl !== location.href) return;
      toast(
        controller.signal.aborted
          ? "读取仓库超时，仍可浏览本地快照。"
          : error.message || "暂时无法打开这个分享仓库。",
      );
    } finally {
      clearTimeout(timeout);
      if (sharedRequest === controller) sharedRequest = null;
    }
  }
  async function loadFiles() {
    var skill = getSkill(state.detailId);
    if (!skill || detailRequest) return;
    var controller = new AbortController();
    detailRequest = controller;
    var timeout = setTimeout(function () {
      controller.abort();
    }, 15000);
    $("#fileResults").innerHTML =
      '<p class="file-status" role="status">正在读取 GitHub 默认分支的文件索引…</p>';
    try {
      var branch = skill.defaultBranch;
      if (!branch) {
        var repo = await githubJson(
          "https://api.github.com/repos/" + skill.id,
          controller.signal,
        );
        branch = repo.default_branch;
      }
      if (!branch) throw new Error("这个仓库还没有可读取的默认分支。");
      var tree = await githubJson(
        "https://api.github.com/repos/" +
          skill.id +
          "/git/trees/" +
          encodeURIComponent(branch) +
          "?recursive=1",
        controller.signal,
      );
      if (!Array.isArray(tree.tree))
        throw new Error("GitHub 暂未返回有效的文件索引。");
      var result = {
        branch: branch,
        truncated: !!tree.truncated,
        paths: tree.tree
          .filter(function (node) {
            return node.type === "blob" && /(^|\/)skill\.md$/i.test(node.path);
          })
          .map(function (node) {
            return node.path;
          })
          .sort(),
      };
      fileCache.set(skill.id.toLowerCase(), result);
      if (
        detailRequest === controller &&
        state.detailId === skill.id &&
        $("#detailDialog").open
      )
        renderFiles(skill, result);
    } catch (error) {
      if (
        detailRequest !== controller ||
        state.detailId !== skill.id ||
        !$("#detailDialog").open
      )
        return;
      var message = controller.signal.aborted
        ? "连接超时，请检查网络后重试。"
        : error.message || "暂时无法连接 GitHub。";
      $("#fileResults").innerHTML =
        '<p class="file-status" role="status">' +
        esc(message) +
        '</p><button class="button secondary" id="loadFiles">重新读取</button> <a class="text-button" href="' +
        esc(skill.url + "/search?q=path%3ASKILL.md&type=code") +
        '" target="_blank" rel="noopener noreferrer">在 GitHub 搜索文件 ' +
        icon("external") +
        "</a>";
    } finally {
      clearTimeout(timeout);
      if (detailRequest === controller) detailRequest = null;
    }
  }
  function renderFiles(skill, result) {
    $("#fileResults").innerHTML =
      '<p class="file-status">' +
      (result.truncated
        ? "GitHub 返回了不完整的文件树，以下仅展示已读取的 "
        : "当前默认分支 " + esc(result.branch) + " · 找到 ") +
      exact(result.paths.length) +
      " 个技能文件。" +
      (result.paths.length
        ? "列表最多展示前 100 项，可输入目录名缩小范围。"
        : "未发现同名文件时，可以查看 README 了解其他使用方式。") +
      "</p>" +
      (result.paths.length
        ? '<input type="search" id="fileSearch" class="file-search" placeholder="筛选技能名称或目录…" aria-label="筛选仓库内的技能文件" /><div class="file-list" id="fileList"></div>'
        : "") +
      '<a class="text-button" href="' +
      esc(skill.url + "/search?q=path%3ASKILL.md&type=code") +
      '" target="_blank" rel="noopener noreferrer">在 GitHub 查看更多 ' +
      icon("external") +
      "</a>";
    if (result.paths.length) renderFileList(skill, result, "");
  }
  function renderFileList(skill, result, query) {
    var filtered = result.paths.filter(function (path) {
      return path.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });
    $("#fileList").innerHTML = filtered.length
      ? filtered
          .slice(0, 100)
          .map(function (path) {
            var link =
              skill.url +
              "/blob/" +
              encodeURIComponent(result.branch) +
              "/" +
              path.split("/").map(encodeURIComponent).join("/");
            return (
              '<a class="file-item" href="' +
              esc(link) +
              '" target="_blank" rel="noopener noreferrer"><span>' +
              esc(path) +
              "</span>" +
              icon("external") +
              "</a>"
            );
          })
          .join("")
      : '<p class="file-list-empty">没有匹配的技能文件。</p>';
  }
  async function refreshPublishedSnapshot(manual) {
    if (!state.ready || snapshotBusy) return;
    snapshotBusy = true;
    lastSnapshotCheck = Date.now();
    $("#checkSnapshot").disabled = true;
    $("#autoSyncText").textContent = "正在检查线上 Skills 快照…";
    try {
      var configured = $('meta[name="skillatlas-data-endpoint"]');
      var endpoint =
        location.protocol === "file:"
          ? configured && configured.content
          : new URL("./data/skills.json", location.href).href;
      var result = await C.checkPublishedSnapshot(endpoint, state.meta);
      if (result.changed) {
        state.snapshot = result.skills;
        state.meta = result.meta;
        window.SKILL_DATA = { skills: state.snapshot, meta: state.meta };
        // Preserve the current search, view, filters, collection, and open dialog.
        state.q = $("#searchInput").value;
        rebuildIndex();
        renderCurrent();
      }
      var checked = new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      $("#autoSyncText").textContent =
        (result.changed ? "已自动更新" : "已检查") +
        " " +
        checked +
        " · 每 15 分钟检查 · 后台每 3 小时采集";
      if (manual)
        toast(
          result.changed
            ? "已加载最新的 Skills 和今日涨星榜"
            : "已经是当前发布的最新快照",
        );
    } catch (_) {
      $("#autoSyncText").textContent =
        "线上更新暂不可用 · 保留当前快照，稍后自动重试";
      if (manual) toast("暂时无法获取线上快照，现有搜索和收藏仍可使用。");
    } finally {
      if (state.view === "ranking") renderRanking();
      else if (state.view === "discover") renderDailyGrowthPreview();
      snapshotBusy = false;
      $("#checkSnapshot").disabled = false;
    }
  }
  async function syncGitHub() {
    if (!state.ready || state.syncBusy) return;
    if (Date.now() - state.lastSync < 60000) {
      toast("刚刚同步过，稍后再来看看。");
      return;
    }
    var goalAtStart = state.goal;
    state.syncBusy = true;
    var button = $("#syncNow");
    button.disabled = true;
    $("#syncLabel").textContent = "正在同步…";
    var controller = new AbortController(),
      timeout = setTimeout(function () {
        controller.abort();
      }, 12000);
    try {
      var query = C.GOALS[goalAtStart].query + " fork:false";
      var payload = await githubJson(
        "https://api.github.com/search/repositories?q=" +
          encodeURIComponent(query) +
          "&sort=updated&order=desc&per_page=20",
        controller.signal,
      );
      if (!Array.isArray(payload.items))
        throw new Error("GitHub 未返回有效的仓库列表。");
      var items = payload.items.map(C.normalizeLive).filter(Boolean);
      var newCount = items.filter(function (skill) {
        return !lookup.has(skill.id.toLowerCase());
      }).length;
      state.live = C.mergeSkills(state.live, items);
      state.lastSync = Date.now();
      rebuildIndex();
      renderCurrent();
      $("#syncFeedback").textContent =
        "已为「" +
        C.GOALS[goalAtStart].label +
        "」同步 " +
        items.length +
        " 个仓库，新增 " +
        newCount +
        " 个发现。同步结果已加入本次浏览，完整快照时间保持不变。";
      $("#syncFeedback").hidden = false;
      toast("本次发现已加入技能库");
    } catch (error) {
      $("#syncFeedback").textContent =
        (controller.signal.aborted
          ? "连接 GitHub 超时。"
          : error.message || "暂时无法连接 GitHub。") +
        " 你可以继续使用本地快照。";
      $("#syncFeedback").hidden = false;
      toast("同步未完成，本地技能库仍可使用");
    } finally {
      clearTimeout(timeout);
      state.syncBusy = false;
      button.disabled = false;
      $("#syncLabel").textContent = "同步 GitHub";
    }
  }
  function exportSaved() {
    var blob = new Blob(
      [
        JSON.stringify(
          {
            app: "SkillAtlas",
            version: 1,
            exportedAt: new Date().toISOString(),
            skills: Array.from(saved.values()),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    var url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download =
      "skillatlas-saved-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    toast("收藏已导出");
  }
  async function importSaved(file) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("请选择小于 10 MB 的收藏文件。");
      var payload = JSON.parse(await file.text());
      if (
        !payload ||
        payload.app !== "SkillAtlas" ||
        payload.version !== 1 ||
        !Array.isArray(payload.skills) ||
        payload.skills.length > 5000
      )
        throw new Error("这不是有效的 SkillAtlas 收藏文件。");
      var valid = payload.skills.map(C.normalize).filter(Boolean);
      if (valid.length !== payload.skills.length)
        throw new Error("收藏文件含有无效的仓库记录，未导入。");
      var next = new Map(saved);
      valid.forEach(function (s) {
        next.set(s.id.toLowerCase(), getSkill(s.id) || s);
      });
      if (next.size > 5000)
        throw new Error("收藏数量超过 5,000 条，请分批整理。");
      if (!writeStore("skillatlas-saved", Array.from(next.values())))
        throw new Error("浏览器空间不足，未能导入收藏。");
      var added = next.size - saved.size;
      saved = next;
      rebuildIndex();
      renderCurrent();
      toast("已导入，新增 " + added + " 个收藏");
    } catch (error) {
      toast(
        error instanceof SyntaxError
          ? "JSON 文件无法解析，请检查收藏文件。"
          : error.message,
      );
    }
    $("#importSaved").value = "";
  }

  document.addEventListener("click", function (event) {
    var el;
    if ((el = event.target.closest("[data-save]"))) {
      toggleSaved(el.dataset.save);
      return;
    }
    if ((el = event.target.closest("[data-open]"))) {
      openDetail(el.dataset.open);
      return;
    }
    if ((el = event.target.closest("[data-view]"))) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      navigate(el.dataset.view, true);
      return;
    }
    if ((el = event.target.closest("[data-category]"))) {
      resetFilters();
      state.cat = el.dataset.category;
      navigate("browse");
      return;
    }
    if ((el = event.target.closest("[data-filter-cat]"))) {
      state.cat = el.dataset.filterCat;
      state.page = 1;
      renderCurrent();
      syncUrl();
      return;
    }
    if ((el = event.target.closest("[data-goal]"))) {
      state.goal = el.dataset.goal;
      state.dailyOffset = 0;
      persistProfile();
      renderCurrent();
      syncUrl();
      return;
    }
    if ((el = event.target.closest("[data-layout]"))) {
      state.layout = el.dataset.layout;
      persistProfile();
      renderCurrent();
      return;
    }
    if ((el = event.target.closest("[data-rank]"))) {
      state.rank = el.dataset.rank;
      renderRanking();
      syncUrl();
      return;
    }
    if (event.target.closest("[data-reset]")) {
      resetFilters();
      renderCurrent();
      syncUrl();
      return;
    }
    if ((el = event.target.closest("[data-topic]"))) {
      var topic = el.dataset.topic;
      closeDetail();
      resetFilters();
      state.q = "topic:" + topic;
      navigate("browse");
      return;
    }
    if (event.target.closest("#loadFiles")) {
      loadFiles();
      return;
    }
    if (event.target.closest("#shareSkill")) {
      copyText(currentUrl(state.detailId).href);
      return;
    }
    if (event.target.closest("#copyClone")) {
      var skill = getSkill(state.detailId);
      if (skill)
        copyText(
          "git clone " + skill.url + ".git",
          "已复制克隆命令，使用方法请查看仓库 README",
        );
    }
  });
  $("#searchInput").addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      if (!state.ready) return;
      state.q = $("#searchInput").value;
      state.page = 1;
      if (state.view !== "saved") state.view = "browse";
      renderCurrent();
      syncUrl();
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 160);
  });
  $("#searchForm").addEventListener("submit", function (event) {
    event.preventDefault();
    clearTimeout(searchTimer);
    state.q = $("#searchInput").value;
    navigate(state.view === "saved" ? "saved" : "browse");
  });
  ["sortSelect", "languageSelect", "verifiedOnly", "skillOnly"].forEach(
    function (id) {
      $("#" + id).addEventListener("change", function (event) {
        var key = {
          sortSelect: "sort",
          languageSelect: "language",
          verifiedOnly: "verifiedOnly",
          skillOnly: "skillOnly",
        }[id];
        state[key] =
          event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value;
        state.page = 1;
        renderCurrent();
        syncUrl();
      });
    },
  );
  $("#resetFilters").addEventListener("click", function () {
    resetFilters();
    renderCurrent();
    syncUrl();
  });
  $("#shufflePicks").addEventListener("click", function () {
    state.dailyOffset++;
    renderDiscover();
  });
  $("#loadMore").addEventListener("click", function () {
    var previousCount = $("#catalogGrid").children.length;
    state.page++;
    renderCatalog();
    var nextCard = $("#catalogGrid").children[previousCount];
    if (nextCard) {
      var button = nextCard.querySelector("[data-open]");
      if (button) button.focus({ preventScroll: true });
    }
  });
  $("#shareFilters").addEventListener("click", function () {
    copyText(currentUrl().href);
  });
  $("#closeDetail").addEventListener("click", function () {
    closeDetail();
  });
  $("#detailDialog").addEventListener("cancel", function (event) {
    event.preventDefault();
    closeDetail();
  });
  $("#detailDialog").addEventListener("click", function (event) {
    if (event.target === $("#detailDialog")) {
      var rect = event.target.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        closeDetail();
    }
  });
  $("#detailDialog").addEventListener("input", function (event) {
    if (event.target.id !== "fileSearch") return;
    var skill = getSkill(state.detailId);
    if (skill && fileCache.has(skill.id.toLowerCase()))
      renderFileList(
        skill,
        fileCache.get(skill.id.toLowerCase()),
        event.target.value,
      );
  });
  $("#menuButton").addEventListener("click", function () {
    setMobileMenu(!$("#sidebar").classList.contains("is-open"));
  });
  $("#sidebarBackdrop").addEventListener("click", function () {
    setMobileMenu(false);
    $("#menuButton").focus();
  });
  document.addEventListener("keydown", function (event) {
    var typing = event.target.closest(
      'input,textarea,select,[contenteditable="true"]',
    );
    if (
      event.key === "/" &&
      !typing &&
      !$("#detailDialog").open &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      $("#searchInput").focus();
    }
    if (event.key === "Escape" && $("#sidebar").classList.contains("is-open")) {
      setMobileMenu(false);
      $("#menuButton").focus();
    }
    // Keep the mobile navigation's focus inside the visible drawer.
    if (event.key === "Tab" && $("#sidebar").classList.contains("is-open")) {
      var focusable = $("#sidebar").querySelectorAll(
        "a[href],button:not([disabled])",
      );
      var first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  $("#themeToggle").addEventListener("click", function () {
    var theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    writeStore("skillatlas-theme", theme);
  });
  $("#syncNow").addEventListener("click", syncGitHub);
  $("#checkSnapshot").addEventListener("click", function () {
    refreshPublishedSnapshot(true);
  });
  setInterval(function () {
    if (
      document.visibilityState === "visible" &&
      Date.now() - lastSnapshotCheck >= AUTO_CHECK_INTERVAL
    )
      refreshPublishedSnapshot(false);
  }, AUTO_CHECK_INTERVAL);
  document.addEventListener("visibilitychange", function () {
    if (
      document.visibilityState === "visible" &&
      Date.now() - lastSnapshotCheck >= AUTO_CHECK_INTERVAL
    )
      refreshPublishedSnapshot(false);
  });
  $("#exportSaved").addEventListener("click", exportSaved);
  $("#importSaved").addEventListener("change", function (event) {
    importSaved(event.target.files[0]);
  });
  $("#retryLoad").addEventListener("click", function () {
    location.reload();
  });
  window.addEventListener("popstate", function () {
    if (!state.ready) return;
    clearTimeout(searchTimer);
    closeDetail(true);
    var wanted = readUrl();
    renderCurrent();
    if (wanted) openDetail(wanted, true);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760 && $("#sidebar").classList.contains("is-open"))
      setMobileMenu(false);
    else
      $("#sidebar").inert =
        window.innerWidth <= 760 &&
        !$("#sidebar").classList.contains("is-open");
  });
  window.addEventListener("storage", function (event) {
    if (event.key !== "skillatlas-saved" || !state.ready) return;
    var values = readStore("skillatlas-saved", []);
    if (!Array.isArray(values)) return;
    saved = new Map();
    values.slice(0, 5000).forEach(function (r) {
      var s = C.normalize(r);
      if (s) saved.set(s.id.toLowerCase(), s);
    });
    rebuildIndex();
    renderCurrent();
    updateDetailSave();
  });

  async function boot() {
    hydrateIcons();
    setMobileMenu(false);
    var theme = readStore("skillatlas-theme", "");
    applyTheme(
      theme === "dark" || theme === "light"
        ? theme
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
    );
    try {
      var data = window.SKILL_DATA;
      if (!data || !Array.isArray(data.skills) || !data.skills.length) {
        var controller = new AbortController(),
          timeout = setTimeout(function () {
            controller.abort();
          }, 8000);
        try {
          var response = await fetch("./data/skills.json", {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("No dataset");
          data = await response.json();
        } finally {
          clearTimeout(timeout);
        }
      }
      if (!data || !Array.isArray(data.skills) || !data.skills.length)
        throw new Error("Empty dataset");
      state.snapshot = data.skills.map(C.normalize).filter(Boolean);
      if (!state.snapshot.length) throw new Error("Invalid dataset");
      state.meta = data.meta || {};
      state.ready = true;
      rebuildIndex();
      var wanted = readUrl();
      renderCurrent();
      $("#loadingState").hidden = true;
      $("#appContent").hidden = false;
      if (wanted) openDetail(wanted, true);
      refreshPublishedSnapshot(false);
    } catch (_) {
      $("#loadingState").hidden = true;
      $("#loadError").hidden = false;
    }
  }
  boot();
})();
