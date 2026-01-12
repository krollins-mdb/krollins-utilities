/**
 * Team Balance Analyzer
 * Analyzes workload distribution across team members
 */

import type { JiraIssue, BalanceMetrics } from "../types.js";

/**
 * Analyze team workload balance
 */
export function analyzeTeamBalance(issues: JiraIssue[]): BalanceMetrics {
  // Calculate metrics by person
  const byPerson: Record<
    string,
    {
      totalPoints: number;
      issueCount: number;
      avgPointsPerIssue: number;
    }
  > = {};

  issues.forEach((issue) => {
    if (!byPerson[issue.assignee]) {
      byPerson[issue.assignee] = {
        totalPoints: 0,
        issueCount: 0,
        avgPointsPerIssue: 0,
      };
    }

    byPerson[issue.assignee].totalPoints += issue.storyPoints || 0;
    byPerson[issue.assignee].issueCount++;
  });

  // Calculate average points per issue for each person
  Object.keys(byPerson).forEach((person) => {
    const data = byPerson[person];
    data.avgPointsPerIssue =
      data.issueCount > 0
        ? Math.round((data.totalPoints / data.issueCount) * 10) / 10
        : 0;
  });

  // Calculate team average
  const totalPoints = Object.values(byPerson).reduce(
    (sum, data) => sum + data.totalPoints,
    0
  );
  const personCount = Object.keys(byPerson).length;
  const avgPointsPerPerson = personCount > 0 ? totalPoints / personCount : 0;

  // Identify load imbalances (>20% variance from average)
  const loadImbalances = Object.entries(byPerson)
    .map(([person, data]) => {
      const variance =
        ((data.totalPoints - avgPointsPerPerson) / avgPointsPerPerson) * 100;
      return { person, variance };
    })
    .filter((item) => Math.abs(item.variance) > 20)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  return {
    byPerson,
    avgPointsPerPerson: Math.round(avgPointsPerPerson),
    loadImbalances,
  };
}
