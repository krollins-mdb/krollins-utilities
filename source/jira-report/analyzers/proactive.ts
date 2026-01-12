/**
 * Proactive Work Analyzer
 * Analyzes proactive vs. reactive work patterns
 */

import type { JiraIssue, ProactiveMetrics } from "../types.js";
import { getMonthName } from "../utils/dateUtils.js";

/**
 * Analyze proactive vs. reactive work patterns
 */
export function analyzeProactive(issues: JiraIssue[]): ProactiveMetrics {
  const proactiveIssues = issues.filter((issue) => issue.isProactive);
  const reactiveIssues = issues.filter((issue) => issue.isReactive);

  const proactiveCount = proactiveIssues.length;
  const reactiveCount = reactiveIssues.length;

  const proactivePoints = proactiveIssues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0
  );

  const reactivePoints = reactiveIssues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0
  );

  const totalPoints = proactivePoints + reactivePoints;
  const proactivePercentage =
    totalPoints > 0 ? Math.round((proactivePoints / totalPoints) * 100) : 0;

  // Calculate by person
  const byPerson: Record<
    string,
    { proactivePoints: number; reactivePoints: number }
  > = {};

  issues.forEach((issue) => {
    if (!byPerson[issue.assignee]) {
      byPerson[issue.assignee] = { proactivePoints: 0, reactivePoints: 0 };
    }

    const points = issue.storyPoints || 0;
    if (issue.isProactive) {
      byPerson[issue.assignee].proactivePoints += points;
    }
    if (issue.isReactive) {
      byPerson[issue.assignee].reactivePoints += points;
    }
  });

  // Calculate monthly trend
  const monthlyData = new Map<
    string,
    { proactive: number; reactive: number }
  >();

  issues.forEach((issue) => {
    const month = getMonthName(issue.resolved);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { proactive: 0, reactive: 0 });
    }

    const data = monthlyData.get(month)!;
    const points = issue.storyPoints || 0;

    if (issue.isProactive) {
      data.proactive += points;
    }
    if (issue.isReactive) {
      data.reactive += points;
    }
  });

  // Convert to sorted array
  const monthlyTrend = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      proactivePoints: data.proactive,
      reactivePoints: data.reactive,
    }))
    .sort((a, b) => {
      // Sort chronologically by parsing month strings
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });

  return {
    proactiveCount,
    reactiveCount,
    proactivePoints,
    reactivePoints,
    proactivePercentage,
    byPerson,
    monthlyTrend,
  };
}
