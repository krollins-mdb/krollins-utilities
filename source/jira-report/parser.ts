/**
 * CSV parser for Jira exports
 */

import { readFile, stat } from "fs/promises";
import { parse } from "csv-parse/sync";

/**
 * Maximum allowed CSV file size (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Maximum allowed number of rows (100,000 issues)
 */
const MAX_ROWS = 100000;

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
 * @throws Error if file is too large, has too many rows, or parsing fails
 */
export async function parseJiraCSV(filePath: string): Promise<ParsedIssue[]> {
  try {
    // Check file size before reading
    const fileStats = await stat(filePath);
    if (fileStats.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(fileStats.size / 1024 / 1024);
      const maxSizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
      throw new Error(
        `File too large: ${sizeMB}MB (maximum allowed: ${maxSizeMB}MB). ` +
          `Please split the export into smaller files or filter the data in Jira.`
      );
    }

    // Read the CSV file
    const fileContent = await readFile(filePath, "utf-8");

    // Parse CSV with headers
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as RawJiraRow[];

    // Check row count
    if (records.length > MAX_ROWS) {
      throw new Error(
        `Too many rows: ${records.length.toLocaleString()} (maximum allowed: ${MAX_ROWS.toLocaleString()}). ` +
          `Please filter the export in Jira to include fewer issues.`
      );
    }

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
 * Supports multiple formats:
 * - Jira format: "Aug 20 2025 02:32:51 PM CDT"
 * - ISO 8601: "2025-08-20T14:32:51Z"
 *
 * @param dateString - Date string from Jira CSV
 * @returns Parsed Date object
 * @throws Error if date cannot be parsed
 */
function parseDate(dateString: string): Date {
  if (!dateString || dateString.trim() === "") {
    throw new Error("Date string is empty");
  }

  try {
    // First try ISO 8601 format (if Jira export settings change)
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime()) && dateString.includes("-")) {
      return isoDate;
    }

    // Parse Jira format: "Aug 20 2025 02:32:51 PM CDT"
    // Remove timezone abbreviation as Date constructor handles them inconsistently
    // Supported timezones: CDT, CST, EDT, EST, PDT, PST, MDT, MST, GMT, UTC
    const cleanedDate = dateString.replace(
      /\s+(CDT|CST|EDT|EST|PDT|PST|MDT|MST|GMT|UTC|[A-Z]{2,4})$/,
      ""
    );

    const date = new Date(cleanedDate);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    // Sanity check: date should be reasonable (between 2000 and 2100)
    const year = date.getFullYear();
    if (year < 2000 || year > 2100) {
      throw new Error(
        `Date out of reasonable range: ${dateString} (parsed year: ${year})`
      );
    }

    return date;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Date")) {
      throw error;
    }
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
