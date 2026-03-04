/**
 * HTML Report Writer for GitHub Metrics
 *
 * Generates a standalone HTML report with Chart.js visualizations
 * focused on engagement and usage over time per repository.
 */

import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type {
  CollectionMonthlyMetrics,
  MonthlyMetrics,
  ReferralSource,
  TopPath,
} from "./types.js";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

/** Convert a raw MongoDB collection name to a short display label. */
function formatCollectionName(raw: string): string {
  // e.g. "mongodb_sample-app-nodejs-mflix" → "Node.js"
  const label = raw
    .replace(/^mongodb_sample-app-/, "")
    .replace(/-mflix$/, "")
    .replace("nodejs", "Node.js")
    .replace("python", "Python")
    .replace("java", "Java");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const PALETTE = [
  { border: "#E74C3C", bg: "rgba(231,76,60,0.15)" }, // Java  – red
  { border: "#3498DB", bg: "rgba(52,152,219,0.15)" }, // Python – blue
  { border: "#27AE60", bg: "rgba(39,174,96,0.15)" }, // Node.js – green
  { border: "#9B59B6", bg: "rgba(155,89,182,0.15)" }, // extra / combined – purple
];

// --------------------------------------------------
// Data serialisation
// --------------------------------------------------

interface ReportData {
  generatedDate: string;
  collections: {
    name: string;
    label: string;
    months: string[];
    clones: number[];
    views: number[];
    uniqueViews: number[];
    stars: number[];
    forks: number[];
    watchers: number[];
    newStars: number[];
    newForks: number[];
    newWatchers: number[];
    /** Per-month referral sources (array-of-arrays, aligned with months[]) */
    referralsByMonth: ReferralSource[][];
    /** Per-month top paths (array-of-arrays, aligned with months[]) */
    topPathsByMonth: TopPath[][];
  }[];
  combined: {
    months: string[];
    clones: number[];
    views: number[];
    uniqueViews: number[];
    stars: number[];
    forks: number[];
    watchers: number[];
    newStars: number[];
    newForks: number[];
    newWatchers: number[];
    referralsByMonth: ReferralSource[][];
    topPathsByMonth: TopPath[][];
  };
  totals: {
    clones: number;
    views: number;
    uniqueViews: number;
    stars: number;
    forks: number;
    watchers: number;
  };
}

function buildReportData(
  allCollections: CollectionMonthlyMetrics[],
  combinedMonthly: MonthlyMetrics[],
): ReportData {
  const collections = allCollections.map((c) => {
    const months = c.monthlyData.map((m) => m.month);
    return {
      name: c.collectionName,
      label: formatCollectionName(c.collectionName),
      months,
      clones: c.monthlyData.map((m) => m.clones),
      views: c.monthlyData.map((m) => m.viewCount),
      uniqueViews: c.monthlyData.map((m) => m.uniqueViews),
      stars: c.monthlyData.map((m) => m.stars),
      forks: c.monthlyData.map((m) => m.forks),
      watchers: c.monthlyData.map((m) => m.watchers),
      newStars: c.monthlyData.map((m) => m.newStars ?? 0),
      newForks: c.monthlyData.map((m) => m.newForks ?? 0),
      newWatchers: c.monthlyData.map((m) => m.newWatchers ?? 0),
      referralsByMonth: c.monthlyData.map((m) => m.referralSources),
      topPathsByMonth: c.monthlyData.map((m) => m.topPaths),
    };
  });

  const combined = {
    months: combinedMonthly.map((m) => m.month),
    clones: combinedMonthly.map((m) => m.clones),
    views: combinedMonthly.map((m) => m.viewCount),
    uniqueViews: combinedMonthly.map((m) => m.uniqueViews),
    stars: combinedMonthly.map((m) => m.stars),
    forks: combinedMonthly.map((m) => m.forks),
    watchers: combinedMonthly.map((m) => m.watchers),
    newStars: combinedMonthly.map((m) => m.newStars ?? 0),
    newForks: combinedMonthly.map((m) => m.newForks ?? 0),
    newWatchers: combinedMonthly.map((m) => m.newWatchers ?? 0),
    referralsByMonth: combinedMonthly.map((m) => m.referralSources),
    topPathsByMonth: combinedMonthly.map((m) => m.topPaths),
  };

  // Grand totals: sum summed fields, sum the maxes across collections
  const totals = {
    clones: combined.clones.reduce((a, b) => a + b, 0),
    views: combined.views.reduce((a, b) => a + b, 0),
    uniqueViews: combined.uniqueViews.reduce((a, b) => a + b, 0),
    stars: combined.stars.at(-1) ?? 0,
    forks: combined.forks.at(-1) ?? 0,
    watchers: combined.watchers.at(-1) ?? 0,
  };

  return {
    generatedDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    collections,
    combined,
    totals,
  };
}

// --------------------------------------------------
// HTML template
// --------------------------------------------------

function generateHTML(data: ReportData): string {
  const dataJson = JSON.stringify(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GitHub Metrics Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0f1117;
      --surface:   #1a1d27;
      --border:    #2a2d3a;
      --text:      #e2e8f0;
      --muted:     #94a3b8;
      --accent:    #13AA52;
      --radius:    10px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                   Helvetica, Arial, sans-serif;
      line-height: 1.6;
    }
    html { scroll-behavior: smooth; }

    /* ── Header ─────────────────────────────────── */
    header {
      background: linear-gradient(135deg, #0f1117 0%, #1a1d27 100%);
      border-bottom: 1px solid var(--border);
      padding: 2rem 2.5rem;
    }
    header h1 { font-size: 1.75rem; font-weight: 700; }
    header h1 span { color: var(--accent); }
    .generated-date { color: var(--muted); font-size: 0.875rem; margin-top: .25rem; }

    /* ── Layout ──────────────────────────────────── */
    main { max-width: 1280px; margin: 0 auto; padding: 2rem 2.5rem 4rem; }

    section { margin-bottom: 3rem; }
    section > h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 1.25rem;
      padding-bottom: .5rem;
      border-bottom: 1px solid var(--border);
    }

    /* ── Summary cards ───────────────────────────── */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }
    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1rem;
      text-align: center;
    }
    .metric-card h3 { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .5rem; }
    .metric-value { font-size: 2rem; font-weight: 700; color: var(--accent); }

    /* ── Chart grid ──────────────────────────────── */
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(560px, 1fr));
      gap: 1.5rem;
    }
    .chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }
    .chart-card h3 { font-size: .875rem; font-weight: 600; color: var(--muted); margin-bottom: 1rem; }
    .chart-card canvas { display: block; }

    /* full-width chart */
    .chart-card.wide { grid-column: 1 / -1; }

    /* ── Data table ──────────────────────────────── */
    .table-wrapper { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: .875rem;
    }
    th {
      background: var(--border);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .06em;
      font-size: .7rem;
      padding: .6rem .75rem;
      text-align: right;
    }
    th:first-child, th:nth-child(2) { text-align: left; }
    td {
      padding: .5rem .75rem;
      text-align: right;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }
    td:first-child, td:nth-child(2) { text-align: left; color: var(--muted); font-size: .8rem; }
    tr:hover td { background: rgba(255,255,255,.03); }

    /* tab switcher */
    .tabs { display: flex; gap: .5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .tab-btn {
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--muted);
      cursor: pointer;
      font-size: .8rem;
      padding: .35rem .85rem;
      transition: background .15s, color .15s;
    }
    .tab-btn:hover, .tab-btn.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .section-note { color: var(--muted); font-size: .8rem; margin: -.75rem 0 1.25rem; }

    /* ── Navigation sidebar ─────────────────────── */
    aside.nav {
      position: fixed;
      top: 100px;
      right: 2rem;
      width: 200px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      z-index: 100;
    }
    aside.nav h3 {
      font-size: .75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .08em;
      margin: 0 0 .75rem 0;
      padding-bottom: .5rem;
      border-bottom: 1px solid var(--border);
    }
    aside.nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    aside.nav li {
      margin-bottom: .5rem;
    }
    aside.nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: .8rem;
      display: block;
      padding: .35rem .5rem;
      border-radius: 4px;
      transition: background .15s, color .15s;
    }
    aside.nav a:hover {
      background: rgba(255,255,255,.05);
      color: var(--accent);
    }

    @media (max-width: 1400px) {
      aside.nav { display: none; }
    }

    @media (max-width: 640px) {
      header { padding: 1.25rem 1rem; }
      main { padding: 1rem 1rem 3rem; }
      .chart-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<header>
  <h1>GitHub Metrics — <span>Engagement Report</span></h1>
  <p class="generated-date">Generated on ${data.generatedDate}</p>
</header>

<aside class="nav">
  <h3>Quick Nav</h3>
  <ul>
    <li><a href="#totals">📊 All-Time Totals</a></li>
    <li><a href="#views">👁️ Views Over Time</a></li>
    <li><a href="#clones">📦 Clone Activity</a></li>
    <li><a href="#growth">📈 Repository Growth</a></li>
    <li><a href="#engagement">⭐ New Engagement</a></li>
    <li><a href="#referrals">🔗 Referral Sources</a></li>
    <li><a href="#paths">📄 Top Paths</a></li>
    <li><a href="#data">📋 Monthly Data</a></li>
  </ul>
</aside>

<main>

  <!-- SUMMARY CARDS -->
  <section id="totals">
    <h2>All-Time Totals</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <h3>Total Views</h3>
        <p class="metric-value" id="statViews">—</p>
      </div>
      <div class="metric-card">
        <h3>Unique Views</h3>
        <p class="metric-value" id="statUniq">—</p>
      </div>
      <div class="metric-card">
        <h3>Clones</h3>
        <p class="metric-value" id="statClones">—</p>
      </div>
      <div class="metric-card">
        <h3>Stars</h3>
        <p class="metric-value" id="statStars">—</p>
      </div>
      <div class="metric-card">
        <h3>Forks</h3>
        <p class="metric-value" id="statForks">—</p>
      </div>
      <div class="metric-card">
        <h3>Watchers</h3>
        <p class="metric-value" id="statWatchers">—</p>
      </div>
    </div>
  </section>

  <!-- VIEWS OVER TIME -->
  <section id="views">
    <h2>Views Over Time</h2>
    <div class="chart-grid">
      <div class="chart-card wide">
        <h3>Total Views per Month — by Repository</h3>
        <canvas id="chartViews" height="90"></canvas>
      </div>
      <div class="chart-card wide">
        <h3>Unique Views per Month — by Repository</h3>
        <canvas id="chartUniqViews" height="90"></canvas>
      </div>
    </div>
  </section>

  <!-- CLONES -->
  <section id="clones">
    <h2>Clone Activity</h2>
    <div class="chart-grid">
      <div class="chart-card wide">
        <h3>Clones per Month — by Repository (stacked)</h3>
        <canvas id="chartClones" height="90"></canvas>
      </div>
    </div>
  </section>

  <!-- CUMULATIVE GROWTH -->
  <section id="growth">
    <h2>Repository Growth (Cumulative)</h2>
    <div class="chart-grid">
      <div class="chart-card">
        <h3>Stars Over Time</h3>
        <canvas id="chartStars" height="120"></canvas>
      </div>
      <div class="chart-card">
        <h3>Forks Over Time</h3>
        <canvas id="chartForks" height="120"></canvas>
      </div>
      <div class="chart-card">
        <h3>Watchers Over Time</h3>
        <canvas id="chartWatchers" height="120"></canvas>
      </div>
    </div>
  </section>

  <!-- NEW ENGAGEMENT -->
  <section id="engagement">
    <h2>New Engagement per Month</h2>
    <div class="chart-grid">
      <div class="chart-card wide">
        <h3>New Stars, Forks &amp; Watchers — All Repositories Combined</h3>
        <canvas id="chartNewEngagement" height="90"></canvas>
      </div>
    </div>
  </section>

  <!-- REFERRAL SOURCES -->
  <section id="referrals">
    <h2>Referral Sources</h2>
    <p class="section-note">Where visitors come from. Data available for recent months only.</p>
    <div class="chart-grid">
      <div class="chart-card wide">
        <h3>Top Referrers Over Time — All Repositories Combined (Views)</h3>
        <canvas id="chartReferrals" height="100"></canvas>
      </div>
    </div>
    <div class="chart-grid" style="margin-top:1.5rem">
      <div class="chart-card wide">
        <h3>Referral Source Breakdown — Latest Month with Data</h3>
        <div style="max-width:480px;margin:0 auto">
          <canvas id="chartReferralPie" height="260"></canvas>
        </div>
      </div>
    </div>
    <div class="ref-tables-wrapper" style="margin-top:1.5rem">
      <div class="tabs" id="refTabs"></div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Referrer</th>
              <th>Views</th>
              <th>Uniques</th>
              <th style="text-align:left">Month</th>
              <th style="text-align:left">Repo</th>
            </tr>
          </thead>
          <tbody id="refTableBody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- TOP PATHS -->
  <section id="paths">
    <h2>Top Paths (Pages Visited)</h2>
    <p class="section-note">Most-visited repository pages. Data available for recent months only.</p>
    <div class="chart-grid">
      <div class="chart-card wide">
        <h3>Most-Visited Paths — All Repositories Combined (Latest Month)</h3>
        <canvas id="chartTopPaths" height="140"></canvas>
      </div>
    </div>
    <div class="path-tables-wrapper" style="margin-top:1.5rem">
      <div class="tabs" id="pathTabs"></div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Path</th>
              <th>Views</th>
              <th>Uniques</th>
              <th style="text-align:left">Month</th>
              <th style="text-align:left">Repo</th>
            </tr>
          </thead>
          <tbody id="pathTableBody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- RAW DATA TABLE -->
  <section id="data">
    <h2>Monthly Data</h2>
    <div class="tabs" id="tableTabs"></div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Repo</th>
            <th>Views</th>
            <th>Unique Views</th>
            <th>Clones</th>
            <th>Stars</th>
            <th>Forks</th>
            <th>Watchers</th>
            <th>+Stars</th>
            <th>+Forks</th>
            <th>+Watch</th>
          </tr>
        </thead>
        <tbody id="dataTableBody"></tbody>
      </table>
    </div>
  </section>

</main>

<script>
(function () {
  // ── Embedded data ────────────────────────────────────────────────────────
  const DATA = ${dataJson};

  // ── Utilities ──────────────────────────────────────────────────────────
  function fmt(n) {
    return typeof n === "number" ? n.toLocaleString() : n;
  }

  // Build a union of all month labels across collections (sorted)
  function allMonths(collections) {
    const set = new Set();
    collections.forEach(c => c.months.forEach(m => set.add(m)));
    return Array.from(set).sort();
  }

  // For a given collection, map its values onto a global months array (fill 0)
  function alignToMonths(collection, globalMonths, field) {
    const idx = new Map(collection.months.map((m, i) => [m, i]));
    return globalMonths.map(m => {
      const i = idx.get(m);
      return i !== undefined ? collection[field][i] : 0;
    });
  }

  // ── Populate summary cards ──────────────────────────────────────────────
  document.getElementById("statViews").textContent    = fmt(DATA.totals.views);
  document.getElementById("statUniq").textContent     = fmt(DATA.totals.uniqueViews);
  document.getElementById("statClones").textContent   = fmt(DATA.totals.clones);
  document.getElementById("statStars").textContent    = fmt(DATA.totals.stars);
  document.getElementById("statForks").textContent    = fmt(DATA.totals.forks);
  document.getElementById("statWatchers").textContent = fmt(DATA.totals.watchers);

  // ── Shared chart defaults ───────────────────────────────────────────────
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.borderColor = "#2a2d3a";
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const PALETTE = [
    { border: "#E74C3C", bg: "rgba(231,76,60,0.25)" },
    { border: "#3498DB", bg: "rgba(52,152,219,0.25)" },
    { border: "#27AE60", bg: "rgba(39,174,96,0.25)" },
    { border: "#9B59B6", bg: "rgba(155,89,182,0.25)" },
  ];

  const baseLineOpts = {
    tension: 0.35,
    fill: false,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2,
  };

  // Distinct dash patterns per series so overlapping lines stay visible
  const DASHES = [
    [],          // solid
    [6, 3],      // dashed
    [2, 3],      // dotted
    [8, 3, 2, 3] // dash-dot
  ];

  function lineDatasets(globalMonths, field, withFill) {
    return DATA.collections.map((c, i) => ({
      ...baseLineOpts,
      label: c.label,
      data: alignToMonths(c, globalMonths, field),
      borderColor: PALETTE[i % PALETTE.length].border,
      backgroundColor: PALETTE[i % PALETTE.length].bg,
      borderDash: DASHES[i % DASHES.length],
      fill: withFill ? "origin" : false,
    }));
  }

  function makeLineChart(id, labels, datasets, stacked) {
    return new Chart(document.getElementById(id), {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" } },
          y: {
            stacked: !!stacked,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { callback: v => v.toLocaleString() },
          },
        },
        plugins: {
          legend: { position: "top" },
          tooltip: { callbacks: { label: ctx => " " + ctx.dataset.label + ": " + fmt(ctx.parsed.y) } },
        },
      },
    });
  }

  function makeBarChart(id, labels, datasets, stacked) {
    return new Chart(document.getElementById(id), {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { stacked: !!stacked, grid: { color: "rgba(255,255,255,0.05)" } },
          y: {
            stacked: !!stacked,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { callback: v => v.toLocaleString() },
          },
        },
        plugins: {
          legend: { position: "top" },
          tooltip: { callbacks: { label: ctx => " " + ctx.dataset.label + ": " + fmt(ctx.parsed.y) } },
        },
      },
    });
  }

  // ── Build charts ────────────────────────────────────────────────────────
  const globalMonths = allMonths(DATA.collections);

  // Views over time (line, per repo)
  makeLineChart(
    "chartViews", globalMonths,
    lineDatasets(globalMonths, "views", true),
    false
  );

  // Unique views over time (line, per repo)
  makeLineChart(
    "chartUniqViews", globalMonths,
    lineDatasets(globalMonths, "uniqueViews", true),
    false
  );

  // Clones per month (stacked bar)
  const cloneBarDatasets = DATA.collections.map((c, i) => ({
    label: c.label,
    data: alignToMonths(c, globalMonths, "clones"),
    backgroundColor: PALETTE[i % PALETTE.length].border,
    borderColor: "transparent",
    borderRadius: 4,
  }));
  makeBarChart("chartClones", globalMonths, cloneBarDatasets, true);

  // Stars / Forks / Watchers — cumulative line per repo
  ["Stars", "Forks", "Watchers"].forEach(cap => {
    const field = cap.toLowerCase(); // "stars" / "forks" / "watchers"
    const datasets = DATA.collections.map((c, i) => ({
      ...baseLineOpts,
      label: c.label,
      data: alignToMonths(c, globalMonths, field),
      borderColor: PALETTE[i % PALETTE.length].border,
      backgroundColor: PALETTE[i % PALETTE.length].bg,
      borderDash: DASHES[i % DASHES.length],
    }));
    makeLineChart("chart" + cap, globalMonths, datasets, false);
  });

  // New engagement per month (grouped bar — combined across all repos)
  const combMonths = DATA.combined.months;
  makeBarChart(
    "chartNewEngagement", combMonths,
    [
      {
        label: "New Stars",
        data: DATA.combined.newStars,
        backgroundColor: "#F39C12",
        borderColor: "transparent",
        borderRadius: 4,
      },
      {
        label: "New Forks",
        data: DATA.combined.newForks,
        backgroundColor: "#3498DB",
        borderColor: "transparent",
        borderRadius: 4,
      },
      {
        label: "New Watchers",
        data: DATA.combined.newWatchers,
        backgroundColor: "#27AE60",
        borderColor: "transparent",
        borderRadius: 4,
      },
    ],
    false
  );

  // ── Referral charts ─────────────────────────────────────────────────────
  const REF_PALETTE = [
    "#E74C3C", "#3498DB", "#27AE60", "#F39C12", "#9B59B6",
    "#1ABC9C", "#E67E22", "#2ECC71", "#E91E63", "#00BCD4",
  ];

  // Build a combined referrer → { month → count } map for the stacked bar
  (function buildReferralCharts() {
    // Only consider months that actually have referral data
    const monthsWithRefs = DATA.combined.months.filter((_, i) =>
      DATA.combined.referralsByMonth[i] && DATA.combined.referralsByMonth[i].length > 0
    );
    if (monthsWithRefs.length === 0) return;

    // Aggregate referrer totals across all shown months to pick top N
    const refTotals = new Map();
    monthsWithRefs.forEach(month => {
      const mi = DATA.combined.months.indexOf(month);
      (DATA.combined.referralsByMonth[mi] || []).forEach(r => {
        refTotals.set(r.referrer, (refTotals.get(r.referrer) || 0) + r.count);
      });
    });
    const topReferrers = Array.from(refTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);

    // Build datasets — one per referrer, values aligned to monthsWithRefs
    const refDatasets = topReferrers.map((ref, i) => {
      const data = monthsWithRefs.map(month => {
        const mi = DATA.combined.months.indexOf(month);
        const entry = (DATA.combined.referralsByMonth[mi] || []).find(r => r.referrer === ref);
        return entry ? entry.count : 0;
      });
      return {
        label: ref,
        data,
        backgroundColor: REF_PALETTE[i % REF_PALETTE.length],
        borderColor: "transparent",
        borderRadius: 4,
      };
    });

    makeBarChart("chartReferrals", monthsWithRefs, refDatasets, true);

    // Pie chart — latest month only
    const latestIdx = DATA.combined.months.indexOf(monthsWithRefs[monthsWithRefs.length - 1]);
    const latestRefs = (DATA.combined.referralsByMonth[latestIdx] || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    if (latestRefs.length > 0) {
      new Chart(document.getElementById("chartReferralPie"), {
        type: "doughnut",
        data: {
          labels: latestRefs.map(r => r.referrer),
          datasets: [{
            data: latestRefs.map(r => r.count),
            backgroundColor: latestRefs.map((_, i) => REF_PALETTE[i % REF_PALETTE.length]),
            borderColor: "#1a1d27",
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 14, padding: 12 } },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = ((ctx.parsed / total) * 100).toFixed(1);
                  return " " + ctx.label + ": " + fmt(ctx.parsed) + " (" + pct + "%)";
                }
              }
            },
          },
        },
      });
    }
  })();

  // Referral data table
  (function buildRefTable() {
    const tabsEl = document.getElementById("refTabs");
    const tbodyEl = document.getElementById("refTableBody");
    const collNames = ["All", ...DATA.collections.map(c => c.label)];
    let active = "All";

    function render(label) {
      tbodyEl.innerHTML = "";
      const rows = [];
      const sources = label === "All"
        ? [{ label: "Combined", months: DATA.combined.months, refs: DATA.combined.referralsByMonth }]
            .concat(DATA.collections.map(c => ({ label: c.label, months: c.months, refs: c.referralsByMonth })))
        : DATA.collections.filter(c => c.label === label).map(c => ({ label: c.label, months: c.months, refs: c.referralsByMonth }));

      sources.forEach(src => {
        src.months.forEach((m, mi) => {
          (src.refs[mi] || []).forEach(r => {
            rows.push({ referrer: r.referrer, count: r.count, uniques: r.uniques, month: m, repo: src.label });
          });
        });
      });
      rows.sort((a, b) => b.month.localeCompare(a.month) || b.count - a.count);
      rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = "<td style='text-align:left'>" + r.referrer + "</td><td>" + fmt(r.count) + "</td><td>" + fmt(r.uniques) + "</td><td style='text-align:left'>" + r.month + "</td><td style='text-align:left'>" + r.repo + "</td>";
        tbodyEl.appendChild(tr);
      });
      if (rows.length === 0) { tbodyEl.innerHTML = "<tr><td colspan='5' style='text-align:center;color:var(--muted)'>No referral data available</td></tr>"; }
    }

    collNames.forEach(name => {
      const btn = document.createElement("button");
      btn.className = "tab-btn" + (name === active ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", () => {
        active = name;
        tabsEl.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render(name);
      });
      tabsEl.appendChild(btn);
    });
    render(active);
  })();

  // ── Top paths chart & table ──────────────────────────────────────────────
  (function buildPathCharts() {
    // Horizontal bar of top paths in the latest month with data
    const monthsWithPaths = DATA.combined.months.filter((_, i) =>
      DATA.combined.topPathsByMonth[i] && DATA.combined.topPathsByMonth[i].length > 0
    );
    if (monthsWithPaths.length === 0) return;

    const latestIdx = DATA.combined.months.indexOf(monthsWithPaths[monthsWithPaths.length - 1]);
    const latestPaths = (DATA.combined.topPathsByMonth[latestIdx] || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    if (latestPaths.length > 0) {
      // Shorten labels: strip leading /owner/repo/
      const shortLabels = latestPaths.map(p => {
        const parts = p.path.replace(/^\\//, "").split("/");
        // Drop first two segments (owner/repo) if present
        return parts.length > 2 ? "/" + parts.slice(2).join("/") : p.path;
      });

      new Chart(document.getElementById("chartTopPaths"), {
        type: "bar",
        data: {
          labels: shortLabels,
          datasets: [{
            label: "Views",
            data: latestPaths.map(p => p.count),
            backgroundColor: "#3498DB",
            borderColor: "transparent",
            borderRadius: 4,
          }, {
            label: "Unique visitors",
            data: latestPaths.map(p => p.uniques),
            backgroundColor: "#27AE60",
            borderColor: "transparent",
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          scales: {
            x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { callback: v => v.toLocaleString() } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
          plugins: {
            legend: { position: "top" },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const idx = items[0].dataIndex;
                  return latestPaths[idx].path;
                },
                label: ctx => " " + ctx.dataset.label + ": " + fmt(ctx.parsed.x),
              }
            },
          },
        },
      });
    }
  })();

  // Path data table
  (function buildPathTable() {
    const tabsEl = document.getElementById("pathTabs");
    const tbodyEl = document.getElementById("pathTableBody");
    const collNames = ["All", ...DATA.collections.map(c => c.label)];
    let active = "All";

    function render(label) {
      tbodyEl.innerHTML = "";
      const rows = [];
      const sources = label === "All"
        ? [{ label: "Combined", months: DATA.combined.months, paths: DATA.combined.topPathsByMonth }]
            .concat(DATA.collections.map(c => ({ label: c.label, months: c.months, paths: c.topPathsByMonth })))
        : DATA.collections.filter(c => c.label === label).map(c => ({ label: c.label, months: c.months, paths: c.topPathsByMonth }));

      sources.forEach(src => {
        src.months.forEach((m, mi) => {
          (src.paths[mi] || []).forEach(p => {
            rows.push({ path: p.path, count: p.count, uniques: p.uniques, month: m, repo: src.label });
          });
        });
      });
      rows.sort((a, b) => b.month.localeCompare(a.month) || b.count - a.count);
      rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = "<td style='text-align:left;word-break:break-all;max-width:400px'>" + r.path + "</td><td>" + fmt(r.count) + "</td><td>" + fmt(r.uniques) + "</td><td style='text-align:left'>" + r.month + "</td><td style='text-align:left'>" + r.repo + "</td>";
        tbodyEl.appendChild(tr);
      });
      if (rows.length === 0) { tbodyEl.innerHTML = "<tr><td colspan='5' style='text-align:center;color:var(--muted)'>No path data available</td></tr>"; }
    }

    collNames.forEach(name => {
      const btn = document.createElement("button");
      btn.className = "tab-btn" + (name === active ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", () => {
        active = name;
        tabsEl.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render(name);
      });
      tabsEl.appendChild(btn);
    });
    render(active);
  })();

  // ── Data table ──────────────────────────────────────────────────────────
  const allCollNames = ["All", ...DATA.collections.map(c => c.label)];
  const tabsEl = document.getElementById("tableTabs");
  const tbodyEl = document.getElementById("dataTableBody");

  let activeTab = "All";

  function renderTable(label) {
    tbodyEl.innerHTML = "";
    const rows = [];

    DATA.collections.forEach(c => {
      if (label !== "All" && c.label !== label) return;
      c.months.forEach((m, i) => {
        rows.push({
          month: m,
          repo: c.label,
          views: c.views[i],
          uniqueViews: c.uniqueViews[i],
          clones: c.clones[i],
          stars: c.stars[i],
          forks: c.forks[i],
          watchers: c.watchers[i],
          newStars: c.newStars[i],
          newForks: c.newForks[i],
          newWatchers: c.newWatchers[i],
        });
      });
    });

    // Sort by month then repo
    rows.sort((a, b) => a.month.localeCompare(b.month) || a.repo.localeCompare(b.repo));

    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = \`
        <td>\${r.month}</td>
        <td>\${r.repo}</td>
        <td>\${fmt(r.views)}</td>
        <td>\${fmt(r.uniqueViews)}</td>
        <td>\${fmt(r.clones)}</td>
        <td>\${fmt(r.stars)}</td>
        <td>\${fmt(r.forks)}</td>
        <td>\${fmt(r.watchers)}</td>
        <td>\${fmt(r.newStars)}</td>
        <td>\${fmt(r.newForks)}</td>
        <td>\${fmt(r.newWatchers)}</td>
      \`;
      tbodyEl.appendChild(tr);
    });
  }

  allCollNames.forEach(name => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (name === activeTab ? " active" : "");
    btn.textContent = name;
    btn.addEventListener("click", () => {
      activeTab = name;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTable(name);
    });
    tabsEl.appendChild(btn);
  });

  renderTable(activeTab);
})();
</script>
</body>
</html>
`;
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

/**
 * Generate and write the HTML engagement report.
 * @param allCollections  Per-collection monthly data
 * @param combinedMonthly Combined/grand-total monthly timeline
 * @param outputPath      Destination file path (created if absent)
 */
export async function writeHTMLReport(
  allCollections: CollectionMonthlyMetrics[],
  combinedMonthly: MonthlyMetrics[],
  outputPath: string,
): Promise<void> {
  const data = buildReportData(allCollections, combinedMonthly);
  const html = generateHTML(data);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf-8");
}
