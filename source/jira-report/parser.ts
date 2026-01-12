/**
 * CSV parser for Jira exports
 */

import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";

/**
 * Raw CSV row structure from Jira export
 */
interface RawJiraRow {
  "Issue Type": string;
  Priority: string;
  Summary: string;
  Labels: string;
  "Labels ": string; // Note the space - Jira adds multiple label columns
  "Labels  ": string;
  "Labels   ": string;
  Assignee: string;
  "Custom field (Story Points Estimate)": string;
  "Custom field (Story Points)": string;
  Resolved: string;
  Created: string;
}

/**
 * Parsed issue data structure (before transformation)
 */
export interface ParsedIssue {
  issueType: string;
  priority: string;
  summary: string;
  labels: string[];
  assignee: string;
  storyPointsEstimate?: number;
  storyPoints?: number;
  resolved: Date;
  created: Date;
}

/**
 * Parse a CSV file exported from Jira
 *
 * @param filePath - Path to the CSV file
 * @returns Array of parsed issues
 */
export async function parseJiraCSV(filePath: string): Promise<ParsedIssue[]> {
  try {
    // Read the CSV file
    const fileContent = await readFile(filePath, "utf-8");

    // Parse CSV with headers
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as RawJiraRow[];

    // Transform each row
    return records.map((row) => parseRow(row));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse a single CSV row into a ParsedIssue
 */
function parseRow(row: RawJiraRow): ParsedIssue {
  return {
    issueType: row["Issue Type"] || "",
    priority: row["Priority"] || "",
    summary: row["Summary"] || "",
    labels: parseLabels(row),
    assignee: row["Assignee"] || "",
    storyPointsEstimate: parseNumber(
      row["Custom field (Story Points Estimate)"]
    ),
    storyPoints: parseNumber(row["Custom field (Story Points)"]),
    resolved: parseDate(row["Resolved"]),
    created: parseDate(row["Created"]),
  };
}

/**
 * Parse and flatten all label columns
 * Jira exports labels in multiple columns: Labels, Labels , Labels  , Labels
 */
function parseLabels(row: RawJiraRow): string[] {
  const labelColumns = [
    row["Labels"],
    row["Labels "],
    row["Labels  "],
    row["Labels   "],
  ];

  return labelColumns
    .filter((label) => label && label.trim().length > 0)
    .map((label) => label.trim());
}

/**
 * Parse a number string, handling empty values
 */
function parseNumber(value: string): number | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse a date string from Jira export
 * Format: "Aug 20 2025 02:32:51 PM CDT" or "Jan 10 2025 01:32:16 PM CST"
 */
function parseDate(dateString: string): Date {
  if (!dateString || dateString.trim() === "") {
    throw new Error("Date string is empty");
  }

  try {
    // Remove timezone abbreviation (CDT, CST) as Date constructor handles them inconsistently
    const cleanedDate = dateString.replace(/\s+(CDT|CST|EDT|EST|PDT|PST)$/, "");

    const date = new Date(cleanedDate);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }

    return date;
  } catch (error) {
    throw new Error(`Failed to parse date "${dateString}": ${error}`);
  }
}

/**
 * Validate that all required fields are present in parsed issues
 */
export function validateParsedIssues(issues: ParsedIssue[]): void {
  const errors: string[] = [];

  issues.forEach((issue, index) => {
    if (!issue.summary) {
      errors.push(`Issue at index ${index} is missing summary`);
    }
    if (!issue.created) {
      errors.push(`Issue at index ${index} is missing created date`);
    }
    if (!issue.resolved) {
      errors.push(`Issue at index ${index} is missing resolved date`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join("\n")}`);
  }
}
