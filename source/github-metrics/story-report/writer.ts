/**
 * Report Writer — orchestrates data transformation, template rendering,
 * and file output for the Engagement Storytelling Report.
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { CollectionMonthlyMetrics, MonthlyMetrics } from "../types.js";
import type { StoryReportData } from "./types.js";
import {
  analyseHighIntent,
  analyseConnectionCode,
  analyseGrowth,
} from "./insights.js";
import { getReportHTML } from "./templates/reportTemplate.js";
import { getReportScript } from "./templates/storyTemplates.js";
import { getStyles } from "./templates/styles.js";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function round(n: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// --------------------------------------------------
// Data builder
// --------------------------------------------------

function buildStoryReportData(
  allCollections: CollectionMonthlyMetrics[],
  combined: MonthlyMetrics[],
): StoryReportData {
  // Totals
  const totalViews = combined.reduce((s, m) => s + m.viewCount, 0);
  const totalUniques = combined.reduce((s, m) => s + m.uniqueViews, 0);
  const totalClones = combined.reduce((s, m) => s + m.clones, 0);
  const totalStars = Math.max(...combined.map((m) => m.stars), 0);
  const totalForks = Math.max(...combined.map((m) => m.forks), 0);

  const months = combined.map((m) => m.month).sort();
  const dateRange = {
    start: months[0] ?? "N/A",
    end: months[months.length - 1] ?? "N/A",
  };

  const repoLabels = allCollections.map((c) => {
    const label = c.collectionName
      .replace(/^mongodb_sample-app-/, "")
      .replace(/-mflix$/, "")
      .replace("nodejs", "Node.js")
      .replace("python", "Python")
      .replace("java", "Java");
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  return {
    generatedDate: new Date().toISOString().split("T")[0],
    dateRange,
    totals: {
      views: totalViews,
      uniqueViews: totalUniques,
      clones: totalClones,
      cloneToViewRatio:
        totalViews > 0 ? round((totalClones / totalViews) * 100) : 0,
      stars: totalStars,
      forks: totalForks,
    },
    highIntent: analyseHighIntent(allCollections, combined),
    connectionCode: analyseConnectionCode(allCollections, combined),
    growth: analyseGrowth(allCollections, combined),
    repoLabels,
  };
}

// --------------------------------------------------
// File generation
// --------------------------------------------------

function generateJS(data: StoryReportData): string {
  const dataJson = JSON.stringify(data, null, 2);
  const script = getReportScript();
  return `// Auto-generated — do not edit\nconst DATA = ${dataJson};\n${script}`;
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export async function writeStoryReport(
  allCollections: CollectionMonthlyMetrics[],
  combined: MonthlyMetrics[],
  outputDir: string,
): Promise<string> {
  const data = buildStoryReportData(allCollections, combined);

  const dateRangeStr = `${data.dateRange.start} to ${data.dateRange.end}`;
  const html = getReportHTML(dateRangeStr, data.generatedDate);
  const css = getStyles();
  const js = generateJS(data);

  const assetsDir = join(outputDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  await Promise.all([
    writeFile(join(outputDir, "index.html"), html, "utf-8"),
    writeFile(join(assetsDir, "report.css"), css, "utf-8"),
    writeFile(join(assetsDir, "report.js"), js, "utf-8"),
  ]);

  return join(outputDir, "index.html");
}
