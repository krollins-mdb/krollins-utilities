/**
 * Team Velocity Analyzer
 * Analyzes monthly story point delivery velocity
 */

import type { JiraIssue, VelocityMetrics } from "../types.js";
import { getMonthName } from "../utils/dateUtils.js";

/**
 * Analyze team velocity - story points delivered per month
 */
export function analyzeVelocity(issues: JiraIssue[]): VelocityMetrics {
  // Group issues by month (based on resolved date)
  const monthlyData = new Map<string, { points: number; count: number }>();

  issues.forEach((issue) => {
    const monthKey = `${issue.resolved.getFullYear()}-${String(
      issue.resolved.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthLabel = getMonthName(issue.resolved);

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { points: 0, count: 0 });
    }

    const data = monthlyData.get(monthKey)!;
    data.points += issue.storyPoints || 0;
    data.count += 1;
  });

  // Sort by month chronologically and format for display
  const sortedMonths = Array.from(monthlyData.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: getMonthName(date),
        storyPoints: data.points,
        issueCount: data.count,
      };
    });

  // Calculate average velocity
  const totalPoints = sortedMonths.reduce((sum, m) => sum + m.storyPoints, 0);
  const averageVelocity =
    sortedMonths.length > 0
      ? Math.round((totalPoints / sortedMonths.length) * 10) / 10
      : 0;

  return {
    monthlyVelocity: sortedMonths,
    averageVelocity,
    totalMonths: sortedMonths.length,
  };
}
