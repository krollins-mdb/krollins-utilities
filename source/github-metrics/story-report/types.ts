/**
 * Types for the Sample App Engagement Storytelling Report.
 */

import type { ReferralSource, TopPath } from "../types.js";

// --------------------------------------------------
// Insight severity & structure
// --------------------------------------------------

export type InsightSeverity = "highlight" | "notable" | "info";

export interface Insight {
  severity: InsightSeverity;
  emoji: string;
  title: string;
  description: string;
}

// --------------------------------------------------
// Path categorisation
// --------------------------------------------------

export type PathCategory =
  | "connection"
  | "server"
  | "frontend"
  | "docs"
  | "other";

export interface CategorisedPath {
  path: string;
  category: PathCategory;
  count: number;
  uniques: number;
}

// --------------------------------------------------
// Per-story analysis results
// --------------------------------------------------

export interface HighIntentAnalysis {
  /** Clone-to-view ratio per month, per repo + combined. */
  ratiosByMonth: {
    month: string;
    combined: number;
    perRepo: { label: string; ratio: number }[];
  }[];
  overallRatio: number;
  /** Distribution of path visits by depth category. */
  pathDepth: {
    root: number;
    directory: number;
    file: number;
  };
  insights: Insight[];
}

export interface ConnectionCodeAnalysis {
  /** Top 15 paths for the latest available month, categorised. */
  topPaths: CategorisedPath[];
  /** Aggregated view counts per category. */
  categoryBreakdown: {
    category: PathCategory;
    label: string;
    count: number;
    uniques: number;
  }[];
  /** Per-repo top-5 paths. */
  perRepoTopPaths: {
    label: string;
    paths: CategorisedPath[];
  }[];
  insights: Insight[];
}

export interface GrowthAnalysis {
  /** Absolute combined views per month. */
  viewsByMonth: { month: string; views: number; uniqueViews: number }[];
  /** Month-over-month % change for combined views. */
  momChange: { month: string; pctChange: number }[];
  /** Per-repo views per month aligned to global month axis. */
  perRepoViews: {
    label: string;
    months: string[];
    views: number[];
  }[];
  /** Compound monthly growth rate (as a fraction, e.g. 0.46 = 46%). */
  compoundGrowthRate: number | null;
  /** If the latest month is partial, info about it. */
  partialMonth: {
    month: string;
    daysElapsed: number;
    daysInMonth: number;
    projectedViews: number;
  } | null;
  insights: Insight[];
}

// --------------------------------------------------
// Full report data (serialised into the HTML)
// --------------------------------------------------

export interface StoryReportData {
  generatedDate: string;
  dateRange: { start: string; end: string };
  /** Executive summary totals. */
  totals: {
    views: number;
    uniqueViews: number;
    clones: number;
    cloneToViewRatio: number;
    stars: number;
    forks: number;
  };
  highIntent: HighIntentAnalysis;
  connectionCode: ConnectionCodeAnalysis;
  growth: GrowthAnalysis;
  /** Repo labels in display order. */
  repoLabels: string[];
}
