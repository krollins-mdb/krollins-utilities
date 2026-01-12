/**
 * Project Impact Analyzer
 * Groups work by project labels and calculates impact metrics
 */

import type { JiraIssue, ProjectImpactMetrics } from "../types.js";

/**
 * Analyze project impact across all issues
 */
export function analyzeProjectImpact(
  issues: JiraIssue[]
): ProjectImpactMetrics[] {
  // Group issues by project label
  const projectGroups = new Map<string, JiraIssue[]>();

  issues.forEach((issue) => {
    if (issue.projectLabels.length === 0) {
      // Add to "Other" category if no project labels
      const otherIssues = projectGroups.get("other") || [];
      otherIssues.push(issue);
      projectGroups.set("other", otherIssues);
    } else {
      // Add to each project label (issues can belong to multiple projects)
      issue.projectLabels.forEach((label) => {
        const projectIssues = projectGroups.get(label) || [];
        projectIssues.push(issue);
        projectGroups.set(label, projectIssues);
      });
    }
  });

  // Calculate metrics for each project
  const projectMetrics: ProjectImpactMetrics[] = [];

  projectGroups.forEach((projectIssues, projectName) => {
    const totalStoryPoints = projectIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0),
      0
    );

    const dates = projectIssues.map((issue) => issue.resolved);
    const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const avgPointsPerIssue = totalStoryPoints / projectIssues.length;

    projectMetrics.push({
      projectName,
      totalStoryPoints,
      issueCount: projectIssues.length,
      startDate,
      endDate,
      durationDays,
      avgPointsPerIssue: Math.round(avgPointsPerIssue * 10) / 10,
    });
  });

  // Sort by total story points descending
  return projectMetrics.sort((a, b) => b.totalStoryPoints - a.totalStoryPoints);
}
