/**
 * Complexity Analyzer
 * Analyzes work complexity based on story points
 */

import type { JiraIssue, ComplexityMetrics } from "../types.js";

/**
 * Analyze complexity distribution and highlight biggest wins
 */
export function analyzeComplexity(issues: JiraIssue[]): ComplexityMetrics {
  // Filter by complexity level
  const highComplexity = issues.filter((issue) => issue.complexity === "high");
  const mediumComplexity = issues.filter(
    (issue) => issue.complexity === "medium"
  );
  const lowComplexity = issues.filter((issue) => issue.complexity === "low");

  const total = issues.length;

  // Calculate distribution
  const distribution = {
    high: highComplexity.length,
    medium: mediumComplexity.length,
    low: lowComplexity.length,
  };

  const percentages = {
    high: total > 0 ? Math.round((highComplexity.length / total) * 100) : 0,
    medium: total > 0 ? Math.round((mediumComplexity.length / total) * 100) : 0,
    low: total > 0 ? Math.round((lowComplexity.length / total) * 100) : 0,
  };

  // Get top 10 biggest wins (sorted by story points)
  const sortedByPoints = [...issues]
    .filter((issue) => issue.storyPoints !== undefined)
    .sort((a, b) => (b.storyPoints || 0) - (a.storyPoints || 0))
    .slice(0, 10);

  const topTenBiggestWins = sortedByPoints.map((issue) => ({
    summary: issue.summary,
    assignee: issue.assignee,
    storyPoints: issue.storyPoints || 0,
    cycleTimeDays: issue.cycleTimeDays,
  }));

  return {
    highComplexityItems: highComplexity,
    distribution,
    percentages,
    topTenBiggestWins,
  };
}
