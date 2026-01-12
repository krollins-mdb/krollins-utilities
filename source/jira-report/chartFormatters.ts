/**
 * Chart Data Formatters
 * Convert analysis results into Chart.js data format
 */

import type { AnalysisResult, ChartData } from "./types.js";

/**
 * Format project impact data for bar chart
 */
export function formatProjectImpactChart(result: AnalysisResult): ChartData {
  const projects = result.celebratingWork.projectImpact;

  return {
    labels: projects.map((p) => p.projectName),
    datasets: [
      {
        label: "Story Points",
        data: projects.map((p) => p.totalStoryPoints),
        backgroundColor: "#3498db",
        borderColor: "#2980b9",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format complexity distribution for doughnut chart
 */
export function formatComplexityDistributionChart(
  result: AnalysisResult
): ChartData {
  const complexity = result.celebratingWork.complexityConquered;

  return {
    labels: ["High (≥8 pts)", "Medium (3-7 pts)", "Low (1-2 pts)"],
    datasets: [
      {
        label: "Issues",
        data: [
          complexity.distribution.high,
          complexity.distribution.medium,
          complexity.distribution.low,
        ],
        backgroundColor: ["#e74c3c", "#f39c12", "#2ecc71"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };
}

/**
 * Format top 10 wins for horizontal bar chart
 */
export function formatTopWinsChart(result: AnalysisResult): ChartData {
  const topWins =
    result.celebratingWork.complexityConquered.topTenBiggestWins.slice(0, 10);

  return {
    labels: topWins.map((w) => truncate(w.summary, 40)),
    datasets: [
      {
        label: "Story Points",
        data: topWins.map((w) => w.storyPoints),
        backgroundColor: "#9b59b6",
        borderColor: "#8e44ad",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format proactive ratio for doughnut chart
 */
export function formatProactiveRatioChart(result: AnalysisResult): ChartData {
  const proactive = result.celebratingWork.proactiveScore;

  return {
    labels: ["Proactive", "Reactive"],
    datasets: [
      {
        label: "Story Points",
        data: [proactive.proactivePoints, proactive.reactivePoints],
        backgroundColor: ["#27ae60", "#e67e22"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };
}

/**
 * Format proactive trend for line chart
 */
export function formatProactiveTrendChart(result: AnalysisResult): ChartData {
  const trend = result.celebratingWork.proactiveScore.monthlyTrend;

  return {
    labels: trend.map((t) => t.month),
    datasets: [
      {
        label: "Proactive",
        data: trend.map((t) => t.proactivePoints),
        backgroundColor: "#27ae60",
        borderColor: "#27ae60",
        borderWidth: 2,
      },
      {
        label: "Reactive",
        data: trend.map((t) => t.reactivePoints),
        backgroundColor: "#e67e22",
        borderColor: "#e67e22",
        borderWidth: 2,
      },
    ],
  };
}

/**
 * Format team velocity for bar chart
 */
export function formatVelocityChart(result: AnalysisResult): ChartData {
  const velocity = result.celebratingWork.velocity.monthlyVelocity;

  return {
    labels: velocity.map((v) => v.month),
    datasets: [
      {
        label: "Story Points",
        data: velocity.map((v) => v.storyPoints),
        backgroundColor: "#3498db",
        borderColor: "#2980b9",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format cycle time by priority for bar chart
 */
export function formatCycleTimeByPriorityChart(
  result: AnalysisResult
): ChartData {
  const byPriority = result.areasForImprovement.cycleTime.byPriority;

  const priorities = Object.keys(byPriority);
  const avgCycleTimes = priorities.map((p) => Math.round(byPriority[p].mean));

  return {
    labels: priorities,
    datasets: [
      {
        label: "Avg Cycle Time (days)",
        data: avgCycleTimes,
        backgroundColor: "#3498db",
        borderColor: "#2980b9",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format cycle time trend for line chart
 */
export function formatCycleTimeTrendChart(result: AnalysisResult): ChartData {
  const trend = result.areasForImprovement.cycleTime.quarterlyTrend;

  return {
    labels: trend.map((t) => t.quarter),
    datasets: [
      {
        label: "Avg Cycle Time (days)",
        data: trend.map((t) => t.avgCycleTime),
        backgroundColor: "rgba(52, 152, 219, 0.2)",
        borderColor: "#3498db",
        borderWidth: 2,
      },
    ],
  };
}

/**
 * Format unplanned work ratio for doughnut chart
 */
export function formatUnplannedWorkChart(result: AnalysisResult): ChartData {
  const unplanned = result.areasForImprovement.unplannedWork;

  return {
    labels: ["Reactive", "Planned"],
    datasets: [
      {
        label: "Story Points",
        data: [unplanned.reactivePoints, unplanned.plannedPoints],
        backgroundColor: ["#e74c3c", "#2ecc71"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };
}

/**
 * Format unplanned work trend for line chart
 */
export function formatUnplannedTrendChart(result: AnalysisResult): ChartData {
  const trend = result.areasForImprovement.unplannedWork.monthlyTrend;

  return {
    labels: trend.map((t) => t.month),
    datasets: [
      {
        label: "Reactive",
        data: trend.map((t) => t.reactivePoints),
        backgroundColor: "rgba(231, 76, 60, 0.2)",
        borderColor: "#e74c3c",
        borderWidth: 2,
      },
      {
        label: "Planned",
        data: trend.map((t) => t.plannedPoints),
        backgroundColor: "rgba(46, 204, 113, 0.2)",
        borderColor: "#2ecc71",
        borderWidth: 2,
      },
    ],
  };
}

/**
 * Format priority distribution for doughnut chart
 */
export function formatPriorityDistributionChart(
  result: AnalysisResult
): ChartData {
  const distribution =
    result.areasForImprovement.priorityAlignment.distribution;

  const priorities = Object.keys(distribution);
  const points = priorities.map((p) => distribution[p].storyPoints);

  return {
    labels: priorities,
    datasets: [
      {
        label: "Story Points",
        data: points,
        backgroundColor: ["#e74c3c", "#f39c12", "#3498db", "#95a5a6"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };
}

/**
 * Format priority cycle time for bar chart
 */
export function formatPriorityCycleTimeChart(
  result: AnalysisResult
): ChartData {
  const avgCycleTime =
    result.areasForImprovement.priorityAlignment.avgCycleTimeByPriority;

  const priorities = Object.keys(avgCycleTime);
  const cycleTimes = priorities.map((p) => avgCycleTime[p]);

  return {
    labels: priorities,
    datasets: [
      {
        label: "Avg Cycle Time (days)",
        data: cycleTimes,
        backgroundColor: "#e67e22",
        borderColor: "#d35400",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format team balance for bar chart
 */
export function formatTeamBalanceChart(result: AnalysisResult): ChartData {
  const byPerson = result.areasForImprovement.teamBalance.byPerson;

  const people = Object.keys(byPerson);
  const points = people.map((p) => byPerson[p].totalPoints);

  return {
    labels: people,
    datasets: [
      {
        label: "Total Story Points",
        data: points,
        backgroundColor: "#9b59b6",
        borderColor: "#8e44ad",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format estimation accuracy for doughnut chart
 */
export function formatEstimationAccuracyChart(
  result: AnalysisResult
): ChartData {
  const estimation = result.areasForImprovement.estimationAccuracy;

  return {
    labels: ["Accurate (±20%)", "Over-estimated", "Under-estimated"],
    datasets: [
      {
        label: "Percentage",
        data: [
          estimation.accuracyPercentage,
          estimation.overEstimationRatio,
          estimation.underEstimationRatio,
        ],
        backgroundColor: ["#2ecc71", "#3498db", "#f39c12"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };
}

/**
 * Format estimation by person for bar chart
 */
export function formatEstimationByPersonChart(
  result: AnalysisResult
): ChartData {
  const byPerson = result.areasForImprovement.estimationAccuracy.byPerson;

  const people = Object.keys(byPerson);
  const accuracies = people.map((p) => byPerson[p].accuracyPercentage);

  return {
    labels: people,
    datasets: [
      {
        label: "Accuracy %",
        data: accuracies,
        backgroundColor: "#1abc9c",
        borderColor: "#16a085",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Format WIP patterns for line chart
 */
export function formatWIPPatternsChart(result: AnalysisResult): ChartData {
  const wip = result.areasForImprovement.workInProgress.byMonth;

  return {
    labels: wip.map((w) => w.month),
    datasets: [
      {
        label: "Avg Cycle Time (days)",
        data: wip.map((w) => w.avgCycleTime),
        backgroundColor: "rgba(155, 89, 182, 0.2)",
        borderColor: "#9b59b6",
        borderWidth: 2,
      },
    ],
  };
}

/**
 * Helper function to truncate text
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
