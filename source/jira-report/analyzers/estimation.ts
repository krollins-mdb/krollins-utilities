/**
 * Estimation Accuracy Analyzer
 * Analyzes how well the team estimates story points
 */

import type { JiraIssue, EstimationMetrics } from "../types.js";

/**
 * Analyze estimation accuracy
 *
 * Compares estimated story points to actual story points delivered
 * to understand estimation patterns. An estimate is considered "accurate"
 * if the actual points are within ±20% of the estimate.
 *
 * Also breaks down accuracy by person and work type (proactive vs reactive)
 * to identify where estimation is strong or needs improvement.
 *
 * @param issues - Array of Jira issues with estimation data
 * @returns Estimation metrics including accuracy percentage and breakdowns
 *
 * @example
 * ```typescript
 * const metrics = analyzeEstimation(issues);
 * console.log(`Team accuracy: ${metrics.accuracyPercentage}%`);
 * ```
 */
export function analyzeEstimation(issues: JiraIssue[]): EstimationMetrics {
  // Filter issues that have both estimate and actual points
  const estimatedIssues = issues.filter(
    (issue) =>
      issue.storyPointsEstimate !== undefined &&
      issue.storyPoints !== undefined &&
      issue.estimationError !== undefined
  );

  if (estimatedIssues.length === 0) {
    return {
      accuracyPercentage: 0,
      overEstimationRatio: 0,
      underEstimationRatio: 0,
      byPerson: {},
      byWorkType: {},
    };
  }

  // Calculate accuracy (within ±20% is considered accurate)
  const accurateEstimates = estimatedIssues.filter(
    (issue) => Math.abs(issue.estimationError!) <= 0.2
  );
  const accuracyPercentage = Math.round(
    (accurateEstimates.length / estimatedIssues.length) * 100
  );

  // Calculate over/under estimation ratios
  const overEstimated = estimatedIssues.filter(
    (issue) => issue.estimationError! < 0
  );
  const underEstimated = estimatedIssues.filter(
    (issue) => issue.estimationError! > 0
  );

  const overEstimationRatio = Math.round(
    (overEstimated.length / estimatedIssues.length) * 100
  );
  const underEstimationRatio = Math.round(
    (underEstimated.length / estimatedIssues.length) * 100
  );

  // Calculate by person
  const byPerson: Record<
    string,
    { accuracyPercentage: number; avgError: number }
  > = {};
  const personGroups = groupBy(estimatedIssues, (issue) => issue.assignee);

  Object.entries(personGroups).forEach(([person, personIssues]) => {
    const accurate = personIssues.filter(
      (issue) => Math.abs(issue.estimationError!) <= 0.2
    );
    const accuracyPct =
      personIssues.length > 0
        ? Math.round((accurate.length / personIssues.length) * 100)
        : 0;

    const avgError =
      personIssues.length > 0
        ? personIssues.reduce((sum, issue) => sum + issue.estimationError!, 0) /
          personIssues.length
        : 0;

    byPerson[person] = {
      accuracyPercentage: accuracyPct,
      avgError: Math.round(avgError * 100) / 100,
    };
  });

  // Calculate by work type (issue type)
  const byWorkType: Record<string, { avgError: number; variance: number }> = {};
  const typeGroups = groupBy(estimatedIssues, (issue) => issue.issueType);

  Object.entries(typeGroups).forEach(([type, typeIssues]) => {
    const errors = typeIssues.map((issue) => issue.estimationError!);
    const avgError =
      errors.length > 0
        ? errors.reduce((sum, err) => sum + err, 0) / errors.length
        : 0;

    // Calculate variance
    const squaredDiffs = errors.map((err) => Math.pow(err - avgError, 2));
    const variance =
      errors.length > 0
        ? squaredDiffs.reduce((sum, diff) => sum + diff, 0) / errors.length
        : 0;

    byWorkType[type] = {
      avgError: Math.round(avgError * 100) / 100,
      variance: Math.round(variance * 100) / 100,
    };
  });

  return {
    accuracyPercentage,
    overEstimationRatio,
    underEstimationRatio,
    byPerson,
    byWorkType,
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
