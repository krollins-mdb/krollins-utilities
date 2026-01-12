/**
 * Priority Alignment Analyzer
 * Analyzes distribution of work across priority levels
 */

import type { JiraIssue, PriorityMetrics } from "../types.js";

/**
 * Analyze priority distribution and alignment
 */
export function analyzePriority(issues: JiraIssue[]): PriorityMetrics {
  // Calculate distribution
  const distribution: Record<
    string,
    { count: number; storyPoints: number; percentage: number }
  > = {};

  issues.forEach((issue) => {
    if (!distribution[issue.priority]) {
      distribution[issue.priority] = {
        count: 0,
        storyPoints: 0,
        percentage: 0,
      };
    }

    distribution[issue.priority].count++;
    distribution[issue.priority].storyPoints += issue.storyPoints || 0;
  });

  // Calculate percentages
  const totalPoints = Object.values(distribution).reduce(
    (sum, d) => sum + d.storyPoints,
    0
  );

  Object.keys(distribution).forEach((priority) => {
    distribution[priority].percentage =
      totalPoints > 0
        ? Math.round((distribution[priority].storyPoints / totalPoints) * 100)
        : 0;
  });

  // Calculate average cycle time by priority
  const avgCycleTimeByPriority: Record<string, number> = {};
  const priorityGroups = groupBy(issues, (issue) => issue.priority);

  Object.entries(priorityGroups).forEach(([priority, groupIssues]) => {
    const totalCycleTime = groupIssues.reduce(
      (sum, issue) => sum + issue.cycleTimeDays,
      0
    );
    avgCycleTimeByPriority[priority] = Math.round(
      totalCycleTime / groupIssues.length
    );
  });

  // Generate recommendations
  const recommendations: string[] = [];

  // Check if P2 (Critical) takes longer than P4 (Minor)
  const p2AvgCycle = avgCycleTimeByPriority["Critical - P2"];
  const p4AvgCycle = avgCycleTimeByPriority["Minor - P4"];

  if (p2AvgCycle && p4AvgCycle && p2AvgCycle > p4AvgCycle) {
    recommendations.push(
      "Critical (P2) items take longer to resolve than Minor (P4) items. Consider prioritizing P2s more aggressively."
    );
  }

  // Check if too much P4 work
  const p4Percentage = distribution["Minor - P4"]?.percentage || 0;
  if (p4Percentage > 50) {
    recommendations.push(
      `${p4Percentage}% of effort is on Minor (P4) work. Consider declining or elevating priority for some items.`
    );
  }

  // Check if too little P2 work
  const p2Percentage = distribution["Critical - P2"]?.percentage || 0;
  if (p2Percentage < 10 && p2Percentage > 0) {
    recommendations.push(
      `Only ${p2Percentage}% of effort is on Critical (P2) work. Ensure high-priority items are properly identified.`
    );
  }

  return {
    distribution,
    avgCycleTimeByPriority,
    recommendations,
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
