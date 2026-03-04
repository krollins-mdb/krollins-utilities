/**
 * Insight Engine for the Storytelling Report.
 *
 * Analyses aggregated monthly metrics and produces data-driven insights
 * for the three focus stories:
 *   1. High-Intent Users, Not Casual Browsers
 *   2. What Developers Really Want: Connection Code
 *   3. Consistent Growth Trajectory
 */

import type {
  CollectionMonthlyMetrics,
  MonthlyMetrics,
  TopPath,
} from "../types.js";
import type {
  HighIntentAnalysis,
  ConnectionCodeAnalysis,
  GrowthAnalysis,
  CategorisedPath,
  PathCategory,
  Insight,
} from "./types.js";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function formatCollectionName(raw: string): string {
  const label = raw
    .replace(/^mongodb_sample-app-/, "")
    .replace(/-mflix$/, "")
    .replace("nodejs", "Node.js")
    .replace("python", "Python")
    .replace("java", "Java");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Round a number to N decimal places. */
function round(n: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Number of days in a given "YYYY-MM" month. */
function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// --------------------------------------------------
// Path categorisation
// --------------------------------------------------

const CONNECTION_PATTERNS = [
  /database\.(ts|js|py|java)/i,
  /mongo[_-]?client/i,
  /mongoconfig/i,
  /connection/i,
  /db\.(ts|js|py|java)/i,
  /config\/database/i,
];

const DOCS_PATTERNS = [/readme/i, /\.md$/i, /docs?\//i, /license/i];

const FRONTEND_PATTERNS = [
  /components?\//i,
  /pages?\//i,
  /views?\//i,
  /public\//i,
  /static\//i,
  /styles?\//i,
  /css/i,
  /client\//i,
];

const SERVER_PATTERNS = [
  /server\//i,
  /api\//i,
  /routes?\//i,
  /controllers?\//i,
  /models?\//i,
  /middleware/i,
  /src\//i,
];

function categorisePath(path: string): PathCategory {
  if (CONNECTION_PATTERNS.some((p) => p.test(path))) return "connection";
  if (DOCS_PATTERNS.some((p) => p.test(path))) return "docs";
  if (FRONTEND_PATTERNS.some((p) => p.test(path))) return "frontend";
  if (SERVER_PATTERNS.some((p) => p.test(path))) return "server";
  return "other";
}

function categorizePaths(paths: TopPath[]): CategorisedPath[] {
  return paths.map((p) => ({
    path: p.path,
    category: categorisePath(p.path),
    count: p.count,
    uniques: p.uniques,
  }));
}

/** Classify a path as root, directory-level, or file-level. */
function pathDepthType(path: string): "root" | "directory" | "file" {
  // Root paths: just the repo name, e.g. /mongodb/sample-app-nodejs-mflix
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length <= 2) return "root";
  // File-level: paths containing /blob/ or ending in a file extension
  if (path.includes("/blob/") || /\.\w{1,5}$/.test(path)) return "file";
  return "directory";
}

const CATEGORY_LABELS: Record<PathCategory, string> = {
  connection: "Connection / Config",
  server: "Server / Backend",
  frontend: "Frontend / UI",
  docs: "Documentation",
  other: "Other",
};

// --------------------------------------------------
// Story 1: High-Intent Users
// --------------------------------------------------

export function analyseHighIntent(
  allCollections: CollectionMonthlyMetrics[],
  combined: MonthlyMetrics[],
): HighIntentAnalysis {
  // Build month-aligned clone-to-view ratios
  const allMonths = [
    ...new Set([
      ...combined.map((m) => m.month),
      ...allCollections.flatMap((c) => c.monthlyData.map((m) => m.month)),
    ]),
  ].sort();

  const ratiosByMonth = allMonths.map((month) => {
    const cm = combined.find((m) => m.month === month);
    const combinedRatio = cm && cm.viewCount > 0 ? cm.clones / cm.viewCount : 0;

    const perRepo = allCollections.map((c) => {
      const md = c.monthlyData.find((m) => m.month === month);
      return {
        label: formatCollectionName(c.collectionName),
        ratio:
          md && md.viewCount > 0 ? round((md.clones / md.viewCount) * 100) : 0,
      };
    });

    return { month, combined: round(combinedRatio * 100), perRepo };
  });

  // Overall ratio
  const totalClones = combined.reduce((s, m) => s + m.clones, 0);
  const totalViews = combined.reduce((s, m) => s + m.viewCount, 0);
  const overallRatio =
    totalViews > 0 ? round((totalClones / totalViews) * 100) : 0;

  // Path depth distribution (aggregate across all repos, all months)
  const pathDepth = { root: 0, directory: 0, file: 0 };
  for (const c of allCollections) {
    for (const md of c.monthlyData) {
      for (const p of md.topPaths) {
        pathDepth[pathDepthType(p.path)] += p.count;
      }
    }
  }

  // Generate insights
  const insights: Insight[] = [];

  if (overallRatio >= 10) {
    insights.push({
      severity: "highlight",
      emoji: "🎯",
      title: "Exceptionally High Clone Rate",
      description: `${overallRatio}% of viewers clone the repository — 2-3× the typical GitHub average of 3-5%. These are users who intend to build, not just browse.`,
    });
  } else if (overallRatio >= 5) {
    insights.push({
      severity: "notable",
      emoji: "📋",
      title: "Above-Average Clone Rate",
      description: `${overallRatio}% of viewers clone the repository, above the typical GitHub average of 3-5%.`,
    });
  }

  const totalPathViews = pathDepth.root + pathDepth.directory + pathDepth.file;
  if (totalPathViews > 0) {
    const filePct = round((pathDepth.file / totalPathViews) * 100);
    if (filePct >= 30) {
      insights.push({
        severity: "highlight",
        emoji: "🔍",
        title: "Users Dig Deep Into Source Code",
        description: `${filePct}% of page views target specific files rather than top-level pages, indicating users study the implementation, not just the README.`,
      });
    } else if (filePct >= 15) {
      insights.push({
        severity: "notable",
        emoji: "📂",
        title: "Meaningful File-Level Exploration",
        description: `${filePct}% of page views go to individual files, showing users explore the codebase beyond the landing page.`,
      });
    }
  }

  return { ratiosByMonth, overallRatio, pathDepth, insights };
}

// --------------------------------------------------
// Story 2: What Developers Really Want
// --------------------------------------------------

export function analyseConnectionCode(
  allCollections: CollectionMonthlyMetrics[],
  combined: MonthlyMetrics[],
): ConnectionCodeAnalysis {
  // Use the latest month with path data across all repos
  const latestMonth =
    combined.length > 0 ? combined[combined.length - 1] : null;

  // Aggregate all paths across all months for the category breakdown
  const allPathMap = new Map<string, { count: number; uniques: number }>();
  for (const c of allCollections) {
    for (const md of c.monthlyData) {
      for (const p of md.topPaths) {
        const existing = allPathMap.get(p.path);
        if (existing) {
          existing.count += p.count;
          existing.uniques = Math.max(existing.uniques, p.uniques);
        } else {
          allPathMap.set(p.path, { count: p.count, uniques: p.uniques });
        }
      }
    }
  }

  // Top paths (latest month, categorised)
  const latestPaths = latestMonth
    ? categorizePaths(latestMonth.topPaths)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
    : [];

  // Category breakdown (all-time)
  const categorySums = new Map<
    PathCategory,
    { count: number; uniques: number }
  >();
  for (const [pathStr, val] of allPathMap) {
    const cat = categorisePath(pathStr);
    const existing = categorySums.get(cat);
    if (existing) {
      existing.count += val.count;
      existing.uniques += val.uniques;
    } else {
      categorySums.set(cat, { count: val.count, uniques: val.uniques });
    }
  }

  const categoryBreakdown = Array.from(categorySums.entries())
    .map(([category, val]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count: val.count,
      uniques: val.uniques,
    }))
    .sort((a, b) => b.count - a.count);

  // Per-repo top-5 paths
  const perRepoTopPaths = allCollections.map((c) => {
    const repoPathMap = new Map<string, { count: number; uniques: number }>();
    for (const md of c.monthlyData) {
      for (const p of md.topPaths) {
        const existing = repoPathMap.get(p.path);
        if (existing) {
          existing.count += p.count;
          existing.uniques = Math.max(existing.uniques, p.uniques);
        } else {
          repoPathMap.set(p.path, { count: p.count, uniques: p.uniques });
        }
      }
    }
    const sorted = Array.from(repoPathMap.entries())
      .map(([path, val]) => ({ path, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      label: formatCollectionName(c.collectionName),
      paths: categorizePaths(
        sorted.map((s) => ({
          path: s.path,
          count: s.count,
          uniques: s.uniques,
        })),
      ),
    };
  });

  // Insights
  const insights: Insight[] = [];

  // Check if connection files dominate across repos
  const connectionPaths = latestPaths.filter(
    (p) => p.category === "connection",
  );
  if (connectionPaths.length > 0) {
    const topCategory = categoryBreakdown[0];
    if (topCategory && topCategory.category === "connection") {
      insights.push({
        severity: "highlight",
        emoji: "🔗",
        title: "Connection Code Is #1",
        description: `Database connection and configuration files are the most-viewed category across all repositories, with ${topCategory.count.toLocaleString()} total views. Developers' top priority is understanding how to connect to MongoDB.`,
      });
    }
  }

  // Check if connection files appear in top paths of multiple repos
  const reposWithConnectionInTop5 = perRepoTopPaths.filter((r) =>
    r.paths.some((p) => p.category === "connection"),
  ).length;
  if (reposWithConnectionInTop5 >= 2) {
    insights.push({
      severity: "notable",
      emoji: "🌐",
      title: "Cross-Language Pattern",
      description: `Connection/config files appear in the top 5 most-viewed paths for ${reposWithConnectionInTop5} of ${allCollections.length} language repos, confirming this is a universal developer need, not language-specific.`,
    });
  }

  // Check if server code is more viewed than frontend
  const serverCat = categoryBreakdown.find((c) => c.category === "server");
  const frontendCat = categoryBreakdown.find((c) => c.category === "frontend");
  if (serverCat && frontendCat && serverCat.count > frontendCat.count * 2) {
    insights.push({
      severity: "info",
      emoji: "⚙️",
      title: "Backend Focus",
      description: `Server/backend code receives ${round(serverCat.count / (frontendCat.count || 1), 1)}× more views than frontend code, suggesting users are primarily interested in the API and data layer.`,
    });
  }

  return {
    topPaths: latestPaths,
    categoryBreakdown,
    perRepoTopPaths,
    insights,
  };
}

// --------------------------------------------------
// Story 3: Consistent Growth Trajectory
// --------------------------------------------------

export function analyseGrowth(
  allCollections: CollectionMonthlyMetrics[],
  combined: MonthlyMetrics[],
): GrowthAnalysis {
  // Views by month
  const viewsByMonth = combined.map((m) => ({
    month: m.month,
    views: m.viewCount,
    uniqueViews: m.uniqueViews,
  }));

  // Month-over-month % change
  const momChange: { month: string; pctChange: number }[] = [];
  for (let i = 1; i < combined.length; i++) {
    const prev = combined[i - 1].viewCount;
    const curr = combined[i].viewCount;
    const pctChange = prev > 0 ? round(((curr - prev) / prev) * 100) : 0;
    momChange.push({ month: combined[i].month, pctChange });
  }

  // Per-repo views aligned to global months
  const allMonths = combined.map((m) => m.month);
  const perRepoViews = allCollections.map((c) => {
    const viewMap = new Map(c.monthlyData.map((m) => [m.month, m.viewCount]));
    return {
      label: formatCollectionName(c.collectionName),
      months: allMonths,
      views: allMonths.map((m) => viewMap.get(m) ?? 0),
    };
  });

  // Compound monthly growth rate
  let compoundGrowthRate: number | null = null;
  if (combined.length >= 2) {
    const first = combined[0].viewCount;
    const last = combined[combined.length - 1].viewCount;
    const periods = combined.length - 1;
    if (first > 0 && last > 0) {
      compoundGrowthRate = round(
        (Math.pow(last / first, 1 / periods) - 1) * 100,
      );
    }
  }

  // Partial month detection
  let partialMonth: GrowthAnalysis["partialMonth"] = null;
  if (combined.length > 0) {
    const latest = combined[combined.length - 1];
    const now = new Date();
    const [y, m] = latest.month.split("-").map(Number);
    const totalDays = daysInMonth(latest.month);

    // If the latest month is the current month, it's partial
    if (y === now.getFullYear() && m === now.getMonth() + 1) {
      const daysElapsed = now.getDate();
      const dailyRate = daysElapsed > 0 ? latest.viewCount / daysElapsed : 0;
      partialMonth = {
        month: latest.month,
        daysElapsed,
        daysInMonth: totalDays,
        projectedViews: Math.round(dailyRate * totalDays),
      };
    }
  }

  // Insights
  const insights: Insight[] = [];

  // Check for sustained growth streak
  const positiveMonths = momChange.filter((m) => m.pctChange > 0);
  if (positiveMonths.length === momChange.length && momChange.length >= 2) {
    insights.push({
      severity: "highlight",
      emoji: "📈",
      title: "Sustained Growth Streak",
      description: `Combined views have grown every month for ${momChange.length} consecutive months, showing consistent upward momentum.`,
    });
  }

  // Biggest single-month jump
  if (momChange.length > 0) {
    const biggest = momChange.reduce((max, m) =>
      m.pctChange > max.pctChange ? m : max,
    );
    if (biggest.pctChange >= 50) {
      insights.push({
        severity: "notable",
        emoji: "🚀",
        title: "Breakout Growth",
        description: `The biggest month-over-month jump was +${biggest.pctChange}% in ${biggest.month}, indicating a significant increase in adoption or visibility.`,
      });
    }
  }

  // Overall multiplier
  if (combined.length >= 2) {
    const first = combined[0].viewCount;
    // Use second-to-last if the latest month is partial
    const lastIndex = partialMonth ? combined.length - 2 : combined.length - 1;
    const last = lastIndex >= 0 ? combined[lastIndex].viewCount : first;
    if (first > 0 && last > first) {
      const multiplier = round(last / first, 1);
      insights.push({
        severity: "highlight",
        emoji: "✨",
        title: `${multiplier}× Traffic Growth`,
        description: `Combined views grew from ${first.toLocaleString()} to ${last.toLocaleString()} over ${lastIndex} months — a ${multiplier}× increase.`,
      });
    }
  }

  // Partial month extrapolation
  if (partialMonth) {
    insights.push({
      severity: "info",
      emoji: "📅",
      title: "Partial Month in Progress",
      description: `${partialMonth.month} has only ${partialMonth.daysElapsed} of ${partialMonth.daysInMonth} days recorded. At the current daily rate, the month would project to ~${partialMonth.projectedViews.toLocaleString()} views.`,
    });
  }

  return {
    viewsByMonth,
    momChange,
    perRepoViews,
    compoundGrowthRate,
    partialMonth,
    insights,
  };
}
