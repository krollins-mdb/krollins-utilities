/**
 * Team Versatility Analyzer
 * Analyzes skill diversity and cross-functional contributions
 */

import type { JiraIssue, VersatilityMetrics } from "../types.js";

/**
 * Analyze team versatility and cross-functional contributions
 */
export function analyzeVersatility(issues: JiraIssue[]): VersatilityMetrics {
  const byPerson: Record<
    string,
    {
      uniqueLabels: string[];
      projectCount: number;
      issueTypes: string[];
    }
  > = {};

  issues.forEach((issue) => {
    if (!byPerson[issue.assignee]) {
      byPerson[issue.assignee] = {
        uniqueLabels: [],
        projectCount: 0,
        issueTypes: [],
      };
    }

    const personData = byPerson[issue.assignee];

    // Add unique labels
    issue.labels.forEach((label) => {
      if (!personData.uniqueLabels.includes(label)) {
        personData.uniqueLabels.push(label);
      }
    });

    // Add unique issue types
    if (!personData.issueTypes.includes(issue.issueType)) {
      personData.issueTypes.push(issue.issueType);
    }
  });

  // Count unique project labels for each person
  Object.keys(byPerson).forEach((person) => {
    const personIssues = issues.filter((issue) => issue.assignee === person);
    const uniqueProjects = new Set<string>();

    personIssues.forEach((issue) => {
      issue.projectLabels.forEach((label) => uniqueProjects.add(label));
    });

    byPerson[person].projectCount = uniqueProjects.size;
  });

  // Identify cross-functional contributors (3+ project themes)
  const crossFunctionalContributors = Object.keys(byPerson).filter(
    (person) => byPerson[person].projectCount >= 3
  );

  return {
    byPerson,
    crossFunctionalContributors,
  };
}
