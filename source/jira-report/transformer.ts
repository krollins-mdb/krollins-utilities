/**
 * Data transformer - converts parsed CSV data into enriched JiraIssue objects
 */

import { differenceInDays } from "date-fns";
import type { JiraIssue } from "./types.js";
import type { ParsedIssue } from "./parser.js";

/**
 * Project-related label keywords
 */
const PROJECT_LABELS = [
  "app-services-eol",
  "dd-code",
  "dd-education",
  "dd-grove",
  "dd-copier-app",
];

/**
 * Transform parsed issues into enriched JiraIssue objects with derived fields
 *
 * @param parsedIssues - Array of parsed issues from CSV
 * @returns Array of enriched JiraIssue objects
 */
export function transformIssues(parsedIssues: ParsedIssue[]): JiraIssue[] {
  return parsedIssues.map((issue) => transformIssue(issue));
}

/**
 * Transform a single parsed issue
 */
function transformIssue(parsed: ParsedIssue): JiraIssue {
  const cycleTimeDays = calculateCycleTime(parsed.created, parsed.resolved);
  const priorityLevel = extractPriorityLevel(parsed.priority);
  const complexity = determineComplexity(parsed.storyPoints);
  const projectLabels = extractProjectLabels(parsed.labels);
  const isProactive = parsed.labels.includes("proactive");
  const isReactive =
    parsed.labels.includes("bug") || parsed.labels.includes("request");
  const estimationError = calculateEstimationError(
    parsed.storyPointsEstimate,
    parsed.storyPoints
  );

  return {
    issueType: parsed.issueType,
    priority: parsed.priority,
    summary: parsed.summary,
    labels: parsed.labels,
    assignee: parsed.assignee,
    storyPointsEstimate: parsed.storyPointsEstimate,
    storyPoints: parsed.storyPoints,
    resolved: parsed.resolved,
    created: parsed.created,
    cycleTimeDays,
    priorityLevel,
    complexity,
    projectLabels,
    isProactive,
    isReactive,
    estimationError,
  };
}

/**
 * Calculate cycle time in days between two dates
 */
function calculateCycleTime(created: Date, resolved: Date): number {
  return differenceInDays(resolved, created);
}

/**
 * Extract priority level number from priority string
 * Examples: "Critical - P2" -> 2, "Major - P3" -> 3
 */
function extractPriorityLevel(priority: string): number {
  const match = priority.match(/P(\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Default fallback based on priority text
  if (priority.includes("Critical")) return 2;
  if (priority.includes("Major")) return 3;
  if (priority.includes("Minor")) return 4;
  if (priority.includes("Trivial")) return 5;

  return 4; // Default to P4 if unknown
}

/**
 * Determine complexity based on story points
 * High: >= 8 points
 * Medium: 3-7 points
 * Low: 1-2 points
 */
function determineComplexity(storyPoints?: number): "high" | "medium" | "low" {
  if (!storyPoints) {
    return "low"; // Default for items without points
  }

  if (storyPoints >= 8) {
    return "high";
  } else if (storyPoints >= 3) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Extract project-related labels from all labels
 */
function extractProjectLabels(labels: string[]): string[] {
  return labels.filter((label) => PROJECT_LABELS.includes(label));
}

/**
 * Calculate estimation error as a percentage
 * Returns undefined if either estimate or actual is missing
 */
function calculateEstimationError(
  estimate?: number,
  actual?: number
): number | undefined {
  if (estimate === undefined || actual === undefined || estimate === 0) {
    return undefined;
  }

  // (Actual - Estimate) / Estimate
  return (actual - estimate) / estimate;
}

/**
 * Extract assignee name from email address
 * Example: "john.doe@mongodb.com" -> "John Doe"
 */
export function extractAssigneeName(email: string): string {
  if (!email) return "Unassigned";

  const namePart = email.split("@")[0];
  const parts = namePart.split(".");

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Filter issues by year
 */
export function filterByYear(issues: JiraIssue[], year: number): JiraIssue[] {
  return issues.filter((issue) => issue.resolved.getFullYear() === year);
}

/**
 * Filter issues by assignee email
 */
export function filterByAssignee(
  issues: JiraIssue[],
  assignee: string
): JiraIssue[] {
  return issues.filter((issue) =>
    issue.assignee.toLowerCase().includes(assignee.toLowerCase())
  );
}

/**
 * Filter issues by project label
 */
export function filterByProject(
  issues: JiraIssue[],
  project: string
): JiraIssue[] {
  return issues.filter((issue) =>
    issue.projectLabels.some((label) =>
      label.toLowerCase().includes(project.toLowerCase())
    )
  );
}
