/**
 * Cycle Time Analyzer
 * Statistical analysis of cycle times across different dimensions
 */

import type {
  JiraIssue,
  CycleTimeMetrics,
  StatisticalSummary,
} from "../types.js";
import { calculateStats } from "../utils/statsUtils.js";
import { getQuarter } from "../utils/dateUtils.js";

/**
 * Analyze cycle time patterns
 *
 * Calculates statistical summaries of how long issues take to resolve,
 * broken down by priority, quarter, and identifies outliers.
 *
 * Outliers are issues that take >2 standard deviations longer than average,
 * which may indicate blockers or unusual complexity.
 *
 * @param issues - Array of Jira issues with cycle time data
 * @returns Cycle time metrics including overall stats, breakdowns, and outliers
 *
 * @example
 * ```typescript
 * const metrics = analyzeCycleTime(issues);
 * console.log(`Average: ${metrics.overall.mean} days`);
 * console.log(`Outliers: ${metrics.outliers.length}`);
 * ```
 */
export function analyzeCycleTime(issues: JiraIssue[]): CycleTimeMetrics {
  const cycleTimes = issues.map((issue) => issue.cycleTimeDays);

  // Overall statistics
  const overall = calculateStats(cycleTimes);

  // By priority level
  const byPriority: Record<string, StatisticalSummary> = {};
  const priorityGroups = groupBy(issues, (issue) => issue.priority);

  Object.entries(priorityGroups).forEach(([priority, groupIssues]) => {
    const times = groupIssues.map((issue) => issue.cycleTimeDays);
    byPriority[priority] = calculateStats(times);
  });

  // Identify outliers (>2 standard deviations from mean)
  const outliers = issues
    .filter((issue) => {
      const deviations =
        Math.abs(issue.cycleTimeDays - overall.mean) / overall.stdDev;
      return deviations > 2;
    })
    .map((issue) => ({
      issue,
      standardDeviations:
        Math.abs(issue.cycleTimeDays - overall.mean) / overall.stdDev,
    }))
    .sort((a, b) => b.standardDeviations - a.standardDeviations);

  // Quarterly trend
  const quarterlyData = new Map<string, number[]>();

  issues.forEach((issue) => {
    const quarter = getQuarter(issue.resolved);
    if (!quarterlyData.has(quarter)) {
      quarterlyData.set(quarter, []);
    }
    quarterlyData.get(quarter)!.push(issue.cycleTimeDays);
  });

  const quarterlyTrend = Array.from(quarterlyData.entries())
    .map(([quarter, times]) => ({
      quarter,
      avgCycleTime:
        times.length > 0
          ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
          : 0,
    }))
    .sort((a, b) => {
      // Sort chronologically
      const [aQ, aYear] = a.quarter.split(" ");
      const [bQ, bYear] = b.quarter.split(" ");
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      return aQ.localeCompare(bQ);
    });

  return {
    overall,
    byPriority,
    outliers,
    quarterlyTrend,
  };
}

/**
 * Helper function to group array by key
 */
function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
