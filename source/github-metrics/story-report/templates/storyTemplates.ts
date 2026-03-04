/**
 * Client-side JavaScript that runs in the browser to populate the report.
 *
 * This function returns a string of JS code that will be embedded in report.js.
 * It reads from a global `DATA` object (StoryReportData serialised as JSON).
 */

export function getReportScript(): string {
  return `
(function () {
  "use strict";

  // ---- Palette (matches existing github-metrics report) ----
  const PALETTE = [
    { border: "#E74C3C", bg: "rgba(231,76,60,0.15)"  },  // Java  – red
    { border: "#3498DB", bg: "rgba(52,152,219,0.15)"  },  // Python – blue
    { border: "#27AE60", bg: "rgba(39,174,96,0.15)"  },  // Node.js – green
    { border: "#9B59B6", bg: "rgba(155,89,182,0.15)"  },  // combined – purple
  ];
  const CATEGORY_COLORS = {
    connection: { border: "#3fb950", bg: "rgba(63,185,80,0.35)"  },
    server:     { border: "#58a6ff", bg: "rgba(88,166,255,0.35)"  },
    frontend:   { border: "#bc8cff", bg: "rgba(188,140,255,0.35)" },
    docs:       { border: "#d29922", bg: "rgba(210,153,34,0.35)"  },
    other:      { border: "#8b949e", bg: "rgba(139,148,158,0.25)" },
  };
  const DASH_PATTERNS = [[], [6, 4], [2, 3], [8, 4, 2, 4]];

  // ---- Chart defaults ----
  Chart.defaults.color = "#8b949e";
  Chart.defaults.borderColor = "rgba(48,54,61,0.6)";
  Chart.defaults.font.family =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

  // ---- Helpers ----
  function renderInsights(containerId, insights) {
    const el = document.getElementById(containerId);
    if (!el || !insights || insights.length === 0) return;
    el.innerHTML = insights
      .map(
        (ins) =>
          '<div class="insight-box ' + ins.severity + '">' +
            '<div class="insight-title">' + ins.emoji + " " + ins.title + "</div>" +
            '<div class="insight-description">' + ins.description + "</div>" +
          "</div>"
      )
      .join("");
  }

  function fmtNum(n) {
    return n != null ? n.toLocaleString() : "—";
  }

  function badgeHTML(category) {
    return '<span class="badge badge-' + category + '">' + category + "</span>";
  }

  // ---- Executive summary metric cards ----
  function renderMetricCards() {
    const t = DATA.totals;
    const cards = [
      { label: "Total Views",       value: fmtNum(t.views) },
      { label: "Unique Views",      value: fmtNum(t.uniqueViews) },
      { label: "Clones",            value: fmtNum(t.clones) },
      { label: "Clone-to-View",     value: t.cloneToViewRatio + "%" },
      { label: "Stars",             value: fmtNum(t.stars) },
      { label: "Forks",             value: fmtNum(t.forks) },
    ];
    const grid = document.getElementById("metricGrid");
    if (!grid) return;
    grid.innerHTML = cards
      .map(
        (c) =>
          '<div class="metric-card">' +
            '<div class="metric-label">' + c.label + "</div>" +
            '<div class="metric-value">' + c.value + "</div>" +
          "</div>"
      )
      .join("");
  }

  // ==================================================================
  // Story 1 — High-Intent Users
  // ==================================================================
  function initHighIntentCharts() {
    const hi = DATA.highIntent;

    // ---- Clone-to-View Ratio line chart ----
    const months = hi.ratiosByMonth.map((r) => r.month);
    const combinedData = hi.ratiosByMonth.map((r) => r.combined);

    const datasets = [];
    // Per-repo lines
    if (hi.ratiosByMonth.length > 0 && hi.ratiosByMonth[0].perRepo) {
      hi.ratiosByMonth[0].perRepo.forEach((repo, idx) => {
        datasets.push({
          label: repo.label,
          data: hi.ratiosByMonth.map((r) => r.perRepo[idx]?.ratio ?? 0),
          borderColor: PALETTE[idx]?.border || "#ccc",
          backgroundColor: PALETTE[idx]?.bg || "rgba(200,200,200,0.15)",
          borderDash: DASH_PATTERNS[idx] || [],
          tension: 0.3,
          pointRadius: 4,
          fill: false,
        });
      });
    }
    // Combined line (thicker)
    datasets.push({
      label: "Combined",
      data: combinedData,
      borderColor: PALETTE[3].border,
      backgroundColor: PALETTE[3].bg,
      borderWidth: 3,
      tension: 0.3,
      pointRadius: 5,
      fill: false,
    });
    // Reference line at ~3% (typical GitHub)
    datasets.push({
      label: "Typical GitHub (~3%)",
      data: months.map(() => 3),
      borderColor: "rgba(139,148,158,0.5)",
      borderDash: [4, 6],
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
    });

    new Chart(document.getElementById("chartCloneRatio"), {
      type: "line",
      data: { labels: months, datasets },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Clone-to-View Ratio (%)" },
            ticks: { callback: (v) => v + "%" },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ": " + ctx.parsed.y.toFixed(1) + "%",
            },
          },
        },
      },
    });

    // ---- Path depth doughnut ----
    const pd = hi.pathDepth;
    new Chart(document.getElementById("chartPathDepth"), {
      type: "doughnut",
      data: {
        labels: ["Repo Root / Landing", "Directory Browsing", "Specific Files"],
        datasets: [
          {
            data: [pd.root, pd.directory, pd.file],
            backgroundColor: [
              "rgba(88,166,255,0.6)",
              "rgba(210,153,34,0.6)",
              "rgba(63,185,80,0.6)",
            ],
            borderColor: ["#58a6ff", "#d29922", "#3fb950"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "55%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                var pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ctx.label + ": " + fmtNum(ctx.parsed) + " (" + pct + "%)";
              },
            },
          },
        },
      },
    });
  }

  // ==================================================================
  // Story 2 — Connection Code
  // ==================================================================
  function initConnectionCodeCharts() {
    var cc = DATA.connectionCode;

    // ---- Top paths horizontal bar ----
    var topPaths = cc.topPaths;
    var pathLabels = topPaths.map(function (p) {
      // shorten long paths
      var s = p.path.replace(/^\\/mongodb\\/sample-app-\\w+-mflix/, "");
      return s.length > 50 ? "…" + s.slice(-47) : s || "(repo root)";
    });
    var pathColors = topPaths.map(function (p) {
      return CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;
    });

    new Chart(document.getElementById("chartTopPaths"), {
      type: "bar",
      data: {
        labels: pathLabels,
        datasets: [
          {
            label: "Views",
            data: topPaths.map(function (p) { return p.count; }),
            backgroundColor: pathColors.map(function (c) { return c.bg; }),
            borderColor: pathColors.map(function (c) { return c.border; }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        scales: {
          x: { beginAtZero: true, title: { display: true, text: "Views" } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function (ctx) {
                return "Category: " + topPaths[ctx.dataIndex].category;
              },
            },
          },
        },
      },
    });

    // ---- Category breakdown doughnut ----
    var cats = cc.categoryBreakdown;
    new Chart(document.getElementById("chartCategoryBreakdown"), {
      type: "doughnut",
      data: {
        labels: cats.map(function (c) { return c.label; }),
        datasets: [
          {
            data: cats.map(function (c) { return c.count; }),
            backgroundColor: cats.map(function (c) {
              return (CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other).bg;
            }),
            borderColor: cats.map(function (c) {
              return (CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other).border;
            }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "55%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ctx.label + ": " + fmtNum(ctx.parsed) + " (" + pct + "%)";
              },
            },
          },
        },
      },
    });

    // ---- Per-repo top paths table ----
    var tableContainer = document.getElementById("perRepoPathsTable");
    if (tableContainer && cc.perRepoTopPaths) {
      var html = "";
      cc.perRepoTopPaths.forEach(function (repo) {
        html += '<h4 style="margin-top:0.75rem;margin-bottom:0.5rem;color:#e6edf3">' +
          repo.label + "</h4>";
        html += '<table class="data-table"><thead><tr>' +
          "<th>Path</th><th>Category</th><th>Views</th></tr></thead><tbody>";
        repo.paths.forEach(function (p) {
          var short = p.path.replace(/^\\/mongodb\\/sample-app-\\w+-mflix/, "");
          html += "<tr><td>" + (short || "(root)") + "</td><td>" +
            badgeHTML(p.category) + "</td><td>" + fmtNum(p.count) + "</td></tr>";
        });
        html += "</tbody></table>";
      });
      tableContainer.innerHTML = html;
    }
  }

  // ==================================================================
  // Story 3 — Growth Trajectory
  // ==================================================================
  function initGrowthCharts() {
    var g = DATA.growth;

    // ---- Combined views area chart ----
    var months = g.viewsByMonth.map(function (v) { return v.month; });
    new Chart(document.getElementById("chartViewsOverTime"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Total Views",
            data: g.viewsByMonth.map(function (v) { return v.views; }),
            borderColor: PALETTE[3].border,
            backgroundColor: PALETTE[3].bg,
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointRadius: 5,
          },
          {
            label: "Unique Views",
            data: g.viewsByMonth.map(function (v) { return v.uniqueViews; }),
            borderColor: PALETTE[2].border,
            backgroundColor: PALETTE[2].bg,
            borderWidth: 2,
            borderDash: [6, 4],
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Views" } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ": " + fmtNum(ctx.parsed.y);
              },
            },
          },
        },
      },
    });

    // ---- Month-over-month % change bar chart ----
    if (g.momChange && g.momChange.length > 0) {
      new Chart(document.getElementById("chartMoMChange"), {
        type: "bar",
        data: {
          labels: g.momChange.map(function (m) { return m.month; }),
          datasets: [
            {
              label: "MoM Change",
              data: g.momChange.map(function (m) { return m.pctChange; }),
              backgroundColor: g.momChange.map(function (m) {
                return m.pctChange >= 0
                  ? "rgba(63,185,80,0.6)"
                  : "rgba(248,81,73,0.6)";
              }),
              borderColor: g.momChange.map(function (m) {
                return m.pctChange >= 0 ? "#3fb950" : "#f85149";
              }),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              title: { display: true, text: "Change (%)" },
              ticks: { callback: function (v) { return v + "%"; } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var sign = ctx.parsed.y >= 0 ? "+" : "";
                  return sign + ctx.parsed.y.toFixed(1) + "%";
                },
              },
            },
          },
        },
      });
    }

    // ---- Per-repo views line chart ----
    if (g.perRepoViews && g.perRepoViews.length > 0) {
      var repoMonths = g.perRepoViews[0].months;
      var repoDatasets = g.perRepoViews.map(function (repo, idx) {
        return {
          label: repo.label,
          data: repo.views,
          borderColor: PALETTE[idx]?.border || "#ccc",
          backgroundColor: PALETTE[idx]?.bg || "rgba(200,200,200,0.15)",
          borderDash: DASH_PATTERNS[idx] || [],
          tension: 0.3,
          pointRadius: 4,
          fill: false,
        };
      });

      new Chart(document.getElementById("chartPerRepoViews"), {
        type: "line",
        data: { labels: repoMonths, datasets: repoDatasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "Views" } },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return ctx.dataset.label + ": " + fmtNum(ctx.parsed.y);
                },
              },
            },
          },
        },
      });
    }
  }

  // ==================================================================
  // Initialise on DOM ready
  // ==================================================================
  document.addEventListener("DOMContentLoaded", function () {
    renderMetricCards();

    // Render insight boxes
    renderInsights("highIntentInsights", DATA.highIntent.insights);
    renderInsights("connectionCodeInsights", DATA.connectionCode.insights);
    renderInsights("growthInsights", DATA.growth.insights);

    // Init charts
    initHighIntentCharts();
    initConnectionCodeCharts();
    initGrowthCharts();
  });
})();
`;
}
