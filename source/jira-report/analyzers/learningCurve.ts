/**
 * Learning Curve Analyzer
 * Identifies recurring work patterns and measures improvement over time
 */

import type { JiraIssue, LearningMetrics } from "../types.js";

/**
 * Analyze learning curves for recurring work patterns
 */
export function analyzeLearningCurve(issues: JiraIssue[]): LearningMetrics[] {
  const patterns = identifyPatterns(issues);
  const learningMetrics: LearningMetrics[] = [];

  patterns.forEach((patternIssues, pattern) => {
    // Need at least 2 occurrences to measure learning
    if (patternIssues.length < 2) {
      return;
    }

    // Sort by resolution date
    const sortedIssues = patternIssues.sort(
      (a, b) => a.resolved.getTime() - b.resolved.getTime()
    );

    const occurrences = sortedIssues.map((issue, index) => ({
      issue,
      cycleTime: issue.cycleTimeDays,
      order: index + 1,
    }));

    const cycleTimes = sortedIssues.map((issue) => issue.cycleTimeDays);
    const averageCycleTime = Math.round(
      cycleTimes.reduce((sum, t) => sum + t, 0) / cycleTimes.length
    );

    const firstCycleTime = cycleTimes[0];
    const lastCycleTime = cycleTimes[cycleTimes.length - 1];

    // Calculate improvement percentage (negative means slower)
    const improvementPercentage =
      firstCycleTime > 0
        ? Math.round(((firstCycleTime - lastCycleTime) / firstCycleTime) * 100)
        : 0;

    learningMetrics.push({
      pattern,
      occurrences,
      averageCycleTime,
      firstCycleTime,
      lastCycleTime,
      improvementPercentage,
    });
  });

  // Sort by number of occurrences (most common patterns first)
  return learningMetrics.sort(
    (a, b) => b.occurrences.length - a.occurrences.length
  );
}

/**
 * Identify recurring patterns in issue summaries
 * Looks for common prefixes and patterns like "Grove X docs", "[Atlas Arch]", etc.
 */
function identifyPatterns(issues: JiraIssue[]): Map<string, JiraIssue[]> {
  const patterns = new Map<string, JiraIssue[]>();

  // Pattern 1: Grove docs (e.g., "Grove Go docs", "Grove Java docs")
  const grovePattern = /Grove\s+\w+\s+docs/i;

  // Pattern 2: Atlas Architecture items with brackets
  const atlasArchPattern = /\[Atlas Arch(?:itecture)?\]/i;

  // Pattern 3: Migration guides
  const migrationPattern = /migration\s+guide/i;

  // Pattern 4: Items with specific prefixes in brackets
  const bracketPattern = /^\[([^\]]+)\]/;

  issues.forEach((issue) => {
    let patternKey: string | null = null;

    if (grovePattern.test(issue.summary)) {
      patternKey = "Grove Documentation (by language)";
    } else if (atlasArchPattern.test(issue.summary)) {
      patternKey = "Atlas Architecture";
    } else if (migrationPattern.test(issue.summary)) {
      patternKey = "Migration Guides";
    } else {
      const bracketMatch = issue.summary.match(bracketPattern);
      if (bracketMatch) {
        patternKey = bracketMatch[1];
      }
    }

    if (patternKey) {
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, []);
      }
      patterns.get(patternKey)!.push(issue);
    }
  });

  // Filter out patterns with only 1 occurrence
  const recurringPatterns = new Map<string, JiraIssue[]>();
  patterns.forEach((issues, pattern) => {
    if (issues.length >= 2) {
      recurringPatterns.set(pattern, issues);
    }
  });

  return recurringPatterns;
}
