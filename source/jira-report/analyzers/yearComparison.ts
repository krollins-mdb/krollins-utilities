/**
 * Year-over-Year Comparison Analyzer
 * Compares metrics between the two most recent years in the dataset
 */

import type {
  JiraIssue,
  YearComparisonMetrics,
  AnalysisResult,
} from "../types.js";

/**
 * Detect if issues span multiple years and compare the two most recent
 *
 * @param issues - All issues in the dataset
 * @param currentYearResult - Analysis result for the most recent year
 * @param previousYearResult - Analysis result for the previous year
 * @returns Year comparison metrics with insights
 */
export function compareYears(
  issues: JiraIssue[],
  currentYearResult: AnalysisResult,
  previousYearResult: AnalysisResult
): YearComparisonMetrics | undefined {
  // Extract years from date ranges
  const currentYear = currentYearResult.summary.dateRange.start.getFullYear();
  const previousYear = previousYearResult.summary.dateRange.start.getFullYear();

  // Calculate comparison metrics
  const issuesComparison = calculateChange(
    currentYearResult.summary.totalIssues,
    previousYearResult.summary.totalIssues
  );

  const storyPointsComparison = calculateChange(
    currentYearResult.summary.totalStoryPoints,
    previousYearResult.summary.totalStoryPoints
  );

  const cycleTimeComparison = calculateChange(
    currentYearResult.areasForImprovement.cycleTime.overall.mean,
    previousYearResult.areasForImprovement.cycleTime.overall.mean
  );

  const highComplexityComparison = calculateChange(
    currentYearResult.celebratingWork.complexityConquered.highComplexityItems
      .length,
    previousYearResult.celebratingWork.complexityConquered.highComplexityItems
      .length
  );

  const proactiveComparison = calculateChange(
    currentYearResult.celebratingWork.proactiveScore.proactivePercentage,
    previousYearResult.celebratingWork.proactiveScore.proactivePercentage
  );

  const estimationComparison = calculateChange(
    currentYearResult.areasForImprovement.estimationAccuracy.accuracyPercentage,
    previousYearResult.areasForImprovement.estimationAccuracy.accuracyPercentage
  );

  // Generate insights
  const insights = generateInsights({
    issues: issuesComparison,
    storyPoints: storyPointsComparison,
    cycleTime: cycleTimeComparison,
    highComplexity: highComplexityComparison,
    proactive: proactiveComparison,
    estimation: estimationComparison,
  });

  return {
    currentYear,
    previousYear,
    comparison: {
      issues: issuesComparison,
      storyPoints: storyPointsComparison,
      avgCycleTime: cycleTimeComparison,
      highComplexityItems: highComplexityComparison,
      proactivePercentage: proactiveComparison,
      estimationAccuracy: estimationComparison,
    },
    insights,
  };
}

/**
 * Calculate change between two values
 */
function calculateChange(current: number, previous: number) {
  const change = current - previous;
  const percentChange = previous !== 0 ? (change / previous) * 100 : 0;

  return {
    current,
    previous,
    change,
    percentChange,
  };
}

/**
 * Generate insights based on comparisons
 */
function generateInsights(metrics: {
  issues: ReturnType<typeof calculateChange>;
  storyPoints: ReturnType<typeof calculateChange>;
  cycleTime: ReturnType<typeof calculateChange>;
  highComplexity: ReturnType<typeof calculateChange>;
  proactive: ReturnType<typeof calculateChange>;
  estimation: ReturnType<typeof calculateChange>;
}): { improvements: string[]; regressions: string[] } {
  const improvements: string[] = [];
  const regressions: string[] = [];

  // Issues delivered
  if (metrics.issues.percentChange > 10) {
    improvements.push(
      `Delivered ${Math.abs(metrics.issues.percentChange).toFixed(
        0
      )}% more issues (${metrics.issues.current} vs ${metrics.issues.previous})`
    );
  } else if (metrics.issues.percentChange < -10) {
    regressions.push(
      `Delivered ${Math.abs(metrics.issues.percentChange).toFixed(
        0
      )}% fewer issues (${metrics.issues.current} vs ${
        metrics.issues.previous
      })`
    );
  }

  // Story points
  if (metrics.storyPoints.percentChange > 10) {
    improvements.push(
      `Completed ${Math.abs(metrics.storyPoints.percentChange).toFixed(
        0
      )}% more story points (${metrics.storyPoints.current.toFixed(
        0
      )} vs ${metrics.storyPoints.previous.toFixed(0)})`
    );
  } else if (metrics.storyPoints.percentChange < -10) {
    regressions.push(
      `Completed ${Math.abs(metrics.storyPoints.percentChange).toFixed(
        0
      )}% fewer story points (${metrics.storyPoints.current.toFixed(
        0
      )} vs ${metrics.storyPoints.previous.toFixed(0)})`
    );
  }

  // Cycle time (lower is better)
  if (metrics.cycleTime.percentChange < -10) {
    improvements.push(
      `Cycle time improved by ${Math.abs(
        metrics.cycleTime.percentChange
      ).toFixed(0)}% (${metrics.cycleTime.current.toFixed(
        0
      )} vs ${metrics.cycleTime.previous.toFixed(0)} days)`
    );
  } else if (metrics.cycleTime.percentChange > 10) {
    regressions.push(
      `Cycle time increased by ${Math.abs(
        metrics.cycleTime.percentChange
      ).toFixed(0)}% (${metrics.cycleTime.current.toFixed(
        0
      )} vs ${metrics.cycleTime.previous.toFixed(0)} days)`
    );
  }

  // High complexity items
  if (metrics.highComplexity.percentChange > 20) {
    improvements.push(
      `Tackled ${Math.abs(metrics.highComplexity.percentChange).toFixed(
        0
      )}% more high-complexity items (${metrics.highComplexity.current} vs ${
        metrics.highComplexity.previous
      })`
    );
  }

  // Proactive work
  if (metrics.proactive.percentChange > 10) {
    improvements.push(
      `Proactive work increased to ${metrics.proactive.current.toFixed(
        0
      )}% (up from ${metrics.proactive.previous.toFixed(0)}%)`
    );
  } else if (metrics.proactive.percentChange < -10) {
    regressions.push(
      `Proactive work decreased to ${metrics.proactive.current.toFixed(
        0
      )}% (down from ${metrics.proactive.previous.toFixed(0)}%)`
    );
  }

  // Estimation accuracy
  if (metrics.estimation.percentChange > 10) {
    improvements.push(
      `Estimation accuracy improved to ${metrics.estimation.current.toFixed(
        0
      )}% (up from ${metrics.estimation.previous.toFixed(0)}%)`
    );
  } else if (metrics.estimation.percentChange < -10) {
    regressions.push(
      `Estimation accuracy declined to ${metrics.estimation.current.toFixed(
        0
      )}% (down from ${metrics.estimation.previous.toFixed(0)}%)`
    );
  }

  // If no changes detected
  if (improvements.length === 0 && regressions.length === 0) {
    improvements.push(
      "Performance metrics remained relatively stable year-over-year"
    );
  }

  return { improvements, regressions };
}

/**
 * Detect available years in the dataset
 *
 * @param issues - All issues
 * @returns Sorted array of years (most recent first)
 */
export function detectYears(issues: JiraIssue[]): number[] {
  const years = new Set<number>();

  issues.forEach((issue) => {
    years.add(issue.resolved.getFullYear());
  });

  return Array.from(years).sort((a, b) => b - a);
}
