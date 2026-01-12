/**
 * Unplanned Work Analyzer
 * Analyzes reactive vs. planned work balance
 */

import type { JiraIssue, UnplannedWorkMetrics } from "../types.js";
import { getMonthName } from "../utils/dateUtils.js";

/**
 * Analyze unplanned (reactive) vs. planned work
 */
export function analyzeUnplannedWork(
  issues: JiraIssue[]
): UnplannedWorkMetrics {
  const reactiveIssues = issues.filter((issue) => issue.isReactive);
  const plannedIssues = issues.filter((issue) => !issue.isReactive);

  const reactiveCount = reactiveIssues.length;
  const plannedCount = plannedIssues.length;

  const reactivePoints = reactiveIssues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0
  );

  const plannedPoints = plannedIssues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0
  );

  const totalPoints = reactivePoints + plannedPoints;
  const reactivePercentage =
    totalPoints > 0 ? Math.round((reactivePoints / totalPoints) * 100) : 0;

  // Calculate monthly trend
  const monthlyData = new Map<string, { reactive: number; planned: number }>();

  issues.forEach((issue) => {
    const month = getMonthName(issue.resolved);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { reactive: 0, planned: 0 });
    }

    const data = monthlyData.get(month)!;
    const points = issue.storyPoints || 0;

    if (issue.isReactive) {
      data.reactive += points;
    } else {
      data.planned += points;
    }
  });

  const monthlyTrend = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      reactivePoints: data.reactive,
      plannedPoints: data.planned,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Calculate by person
  const byPerson: Record<
    string,
    { reactivePoints: number; plannedPoints: number }
  > = {};

  issues.forEach((issue) => {
    if (!byPerson[issue.assignee]) {
      byPerson[issue.assignee] = { reactivePoints: 0, plannedPoints: 0 };
    }

    const points = issue.storyPoints || 0;
    if (issue.isReactive) {
      byPerson[issue.assignee].reactivePoints += points;
    } else {
      byPerson[issue.assignee].plannedPoints += points;
    }
  });

  return {
    reactiveCount,
    plannedCount,
    reactivePoints,
    plannedPoints,
    reactivePercentage,
    monthlyTrend,
    byPerson,
  };
}
