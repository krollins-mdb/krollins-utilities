/**
 * Work-in-Progress Patterns Analyzer
 * Analyzes seasonal patterns and identifies bottleneck periods
 */

import type { JiraIssue, WIPMetrics } from "../types.js";
import { getMonthName } from "../utils/dateUtils.js";

/**
 * Analyze work-in-progress patterns and seasonal trends
 */
export function analyzeWorkInProgress(issues: JiraIssue[]): WIPMetrics {
  // Group by month resolved
  const monthlyData = new Map<
    string,
    {
      cycleTimes: number[];
      longRunningCount: number;
      projects: Set<string>;
    }
  >();

  issues.forEach((issue) => {
    const month = getMonthName(issue.resolved);

    if (!monthlyData.has(month)) {
      monthlyData.set(month, {
        cycleTimes: [],
        longRunningCount: 0,
        projects: new Set(),
      });
    }

    const data = monthlyData.get(month)!;
    data.cycleTimes.push(issue.cycleTimeDays);

    // Count long-running items (>60 days)
    if (issue.cycleTimeDays > 60) {
      data.longRunningCount++;
    }

    // Track concurrent projects
    issue.projectLabels.forEach((label) => data.projects.add(label));
  });

  // Calculate monthly metrics
  const byMonth = Array.from(monthlyData.entries())
    .map(([month, data]) => {
      const avgCycleTime = Math.round(
        data.cycleTimes.reduce((sum, t) => sum + t, 0) / data.cycleTimes.length
      );

      return {
        month,
        avgCycleTime,
        longRunningCount: data.longRunningCount,
        concurrentProjects: data.projects.size,
      };
    })
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Identify bottleneck months (avg cycle time > overall average * 1.25)
  const overallAvgCycleTime =
    byMonth.reduce((sum, m) => sum + m.avgCycleTime, 0) / byMonth.length;
  const bottleneckMonths = byMonth
    .filter((m) => m.avgCycleTime > overallAvgCycleTime * 1.25)
    .map((m) => m.month);

  // Generate seasonal insights
  const seasonalInsights: string[] = [];

  // Check for Q4 slowdown
  const q4Months = byMonth.filter(
    (m) =>
      m.month.includes("Oct") ||
      m.month.includes("Nov") ||
      m.month.includes("Dec")
  );
  if (q4Months.length > 0) {
    const q4Avg =
      q4Months.reduce((sum, m) => sum + m.avgCycleTime, 0) / q4Months.length;
    if (q4Avg > overallAvgCycleTime * 1.2) {
      seasonalInsights.push(
        "Q4 shows slower cycle times, likely due to holidays and end-of-year activities."
      );
    }
  }

  // Check for high concurrency
  const highConcurrency = byMonth.filter((m) => m.concurrentProjects >= 5);
  if (highConcurrency.length > 0) {
    seasonalInsights.push(
      `${highConcurrency.length} month(s) had 5+ concurrent projects, which may impact focus and cycle times.`
    );
  }

  // Check for long-running items
  const totalLongRunning = byMonth.reduce(
    (sum, m) => sum + m.longRunningCount,
    0
  );
  if (totalLongRunning > 0) {
    seasonalInsights.push(
      `${totalLongRunning} items took longer than 60 days to resolve. Consider breaking down large tasks.`
    );
  }

  return {
    byMonth,
    bottleneckMonths,
    seasonalInsights,
  };
}
