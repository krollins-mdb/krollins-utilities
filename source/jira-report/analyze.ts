/**
 * Analysis Orchestrator
 * Coordinates all analyzers and produces complete analysis results
 */

import type { JiraIssue, AnalysisResult } from "./types.js";
import { analyzeProjectImpact } from "./analyzers/projectImpact.js";
import { analyzeComplexity } from "./analyzers/complexity.js";
import { analyzeProactive } from "./analyzers/proactive.js";
import { analyzeVersatility } from "./analyzers/versatility.js";
import { analyzeCycleTime } from "./analyzers/cycleTime.js";
import { analyzeLearningCurve } from "./analyzers/learningCurve.js";
import { analyzeUnplannedWork } from "./analyzers/unplannedWork.js";
import { analyzeWorkInProgress } from "./analyzers/workInProgress.js";
import { analyzeEstimation } from "./analyzers/estimation.js";
import { analyzePriority } from "./analyzers/priority.js";
import { analyzeTeamBalance } from "./analyzers/teamBalance.js";
import { detectYears, compareYears } from "./analyzers/yearComparison.js";

/**
 * Run all analyses on the provided issues
 *
 * @param issues - Array of transformed Jira issues
 * @returns Complete analysis result structure
 */
export function analyzeIssues(issues: JiraIssue[]): AnalysisResult {
  console.log("📈 Running analysis...\n");

  // Calculate summary statistics
  const totalIssues = issues.length;
  const totalStoryPoints = issues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0
  );

  const dates = issues.map((issue) => issue.resolved);
  const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const uniqueAssignees = [...new Set(issues.map((issue) => issue.assignee))];

  console.log("  ✓ Summary statistics calculated");

  // Run all analyzers
  const projectImpact = analyzeProjectImpact(issues);
  console.log("  ✓ Project impact analysis complete");

  const complexityConquered = analyzeComplexity(issues);
  console.log("  ✓ Complexity analysis complete");

  const proactiveScore = analyzeProactive(issues);
  console.log("  ✓ Proactive work analysis complete");

  const teamVersatility = analyzeVersatility(issues);
  console.log("  ✓ Team versatility analysis complete");

  const cycleTime = analyzeCycleTime(issues);
  console.log("  ✓ Cycle time analysis complete");

  const learningCurve = analyzeLearningCurve(issues);
  console.log("  ✓ Learning curve analysis complete");

  const unplannedWork = analyzeUnplannedWork(issues);
  console.log("  ✓ Unplanned work analysis complete");

  const workInProgress = analyzeWorkInProgress(issues);
  console.log("  ✓ Work-in-progress analysis complete");

  const estimationAccuracy = analyzeEstimation(issues);
  console.log("  ✓ Estimation accuracy analysis complete");

  const priorityAlignment = analyzePriority(issues);
  console.log("  ✓ Priority alignment analysis complete");

  const teamBalance = analyzeTeamBalance(issues);
  console.log("  ✓ Team balance analysis complete");

  // Check for year-over-year comparison
  const availableYears = detectYears(issues);
  let yearComparison = undefined;
  let yearData = undefined;

  if (availableYears.length >= 2) {
    console.log(
      "  ℹ️  Multiple years detected - running year-over-year comparison"
    );

    const currentYear = availableYears[0];
    const previousYear = availableYears[1];

    const currentYearIssues = issues.filter(
      (issue) => issue.resolved.getFullYear() === currentYear
    );
    const previousYearIssues = issues.filter(
      (issue) => issue.resolved.getFullYear() === previousYear
    );

    const currentYearResult = runAnalysisForIssues(currentYearIssues);
    const previousYearResult = runAnalysisForIssues(previousYearIssues);

    yearComparison = compareYears(
      issues,
      currentYearResult,
      previousYearResult
    );

    yearData = {
      years: availableYears,
      currentYear,
      previousYear,
      currentYearData: currentYearResult,
      previousYearData: previousYearResult,
    };

    console.log("  ✓ Year-over-year comparison complete\n");
  } else {
    console.log();
  }

  return {
    summary: {
      totalIssues,
      totalStoryPoints,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      uniqueAssignees,
    },
    celebratingWork: {
      projectImpact,
      complexityConquered,
      proactiveScore,
      teamVersatility,
    },
    areasForImprovement: {
      cycleTime,
      learningCurve,
      unplannedWork,
      workInProgress,
      estimationAccuracy,
      priorityAlignment,
      teamBalance,
    },
    yearComparison,
    yearData,
  };
}

/**
 * Run analysis for a subset of issues (used for year comparison)
 */
function runAnalysisForIssues(issues: JiraIssue[]): AnalysisResult {
  const totalIssues = issues.length;
  const totalStoryPoints = issues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0
  );

  const dates = issues.map((issue) => issue.resolved);
  const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const uniqueAssignees = [...new Set(issues.map((issue) => issue.assignee))];

  return {
    summary: {
      totalIssues,
      totalStoryPoints,
      dateRange: { start: startDate, end: endDate },
      uniqueAssignees,
    },
    celebratingWork: {
      projectImpact: analyzeProjectImpact(issues),
      complexityConquered: analyzeComplexity(issues),
      proactiveScore: analyzeProactive(issues),
      teamVersatility: analyzeVersatility(issues),
    },
    areasForImprovement: {
      cycleTime: analyzeCycleTime(issues),
      learningCurve: analyzeLearningCurve(issues),
      unplannedWork: analyzeUnplannedWork(issues),
      workInProgress: analyzeWorkInProgress(issues),
      estimationAccuracy: analyzeEstimation(issues),
      priorityAlignment: analyzePriority(issues),
      teamBalance: analyzeTeamBalance(issues),
    },
  };
}

/**
 * Print analysis summary to console
 */
export function printAnalysisSummary(result: AnalysisResult): void {
  console.log("📊 Analysis Summary\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📈 Overall Metrics:");
  console.log(`   Total Issues: ${result.summary.totalIssues}`);
  console.log(`   Total Story Points: ${result.summary.totalStoryPoints}`);
  console.log(`   Team Size: ${result.summary.uniqueAssignees.length} people`);
  console.log(
    `   Date Range: ${result.summary.dateRange.start.toLocaleDateString()} - ${result.summary.dateRange.end.toLocaleDateString()}\n`
  );

  console.log("🎉 Celebrating Work:");
  console.log(
    `   Projects Tracked: ${result.celebratingWork.projectImpact.length}`
  );
  console.log(
    `   High Complexity Items: ${result.celebratingWork.complexityConquered.highComplexityItems.length}`
  );
  console.log(
    `   Proactive Work: ${result.celebratingWork.proactiveScore.proactivePercentage}%`
  );
  console.log(
    `   Cross-Functional Contributors: ${result.celebratingWork.teamVersatility.crossFunctionalContributors.length}\n`
  );

  console.log("📉 Areas for Improvement:");
  console.log(
    `   Avg Cycle Time: ${Math.round(
      result.areasForImprovement.cycleTime.overall.mean
    )} days`
  );
  console.log(
    `   Cycle Time Outliers: ${result.areasForImprovement.cycleTime.outliers.length}`
  );
  console.log(
    `   Reactive Work: ${result.areasForImprovement.unplannedWork.reactivePercentage}%`
  );
  console.log(
    `   Estimation Accuracy: ${result.areasForImprovement.estimationAccuracy.accuracyPercentage}%`
  );
  console.log(
    `   Bottleneck Months: ${result.areasForImprovement.workInProgress.bottleneckMonths.length}\n`
  );

  if (result.areasForImprovement.priorityAlignment.recommendations.length > 0) {
    console.log("💡 Recommendations:");
    result.areasForImprovement.priorityAlignment.recommendations.forEach(
      (rec) => {
        console.log(`   • ${rec}`);
      }
    );
    console.log();
  }

  // Year-over-year comparison
  if (result.yearComparison) {
    console.log("📅 Year-over-Year Comparison:");
    console.log(
      `   Comparing ${result.yearComparison.currentYear} vs ${result.yearComparison.previousYear}\n`
    );

    if (result.yearComparison.insights.improvements.length > 0) {
      console.log("   📈 Improvements:");
      result.yearComparison.insights.improvements.forEach((improvement) => {
        console.log(`      • ${improvement}`);
      });
      console.log();
    }

    if (result.yearComparison.insights.regressions.length > 0) {
      console.log("   📉 Regressions:");
      result.yearComparison.insights.regressions.forEach((regression) => {
        console.log(`      • ${regression}`);
      });
      console.log();
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
