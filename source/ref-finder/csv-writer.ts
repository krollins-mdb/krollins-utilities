/**
 * CSV generation for the Ref Finder tool.
 *
 * Writes an array of RefReportRow objects to a CSV file with proper
 * escaping and headers.
 */

import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import type { RefReportRow } from "./types.js";

/** CSV column headers matching the README specification. */
const CSV_HEADERS = [
  "ref-name",
  "ref-string",
  "docs-project",
  "source-page",
  "exists-in-atlas",
  "triggers-invocations",
] as const;

/**
 * Escape a value for safe inclusion in a CSV field.
 *
 * Wraps the value in double quotes if it contains commas, quotes,
 * or newlines. Internal double quotes are escaped by doubling them.
 */
function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert a RefReportRow to an array of CSV field values.
 */
function rowToFields(row: RefReportRow): string[] {
  return [
    row.refName,
    row.refString,
    row.docsProject,
    row.sourcePage,
    String(row.existsInAtlas),
    row.triggersInvocations,
  ];
}

/**
 * Write report rows to a CSV file.
 *
 * Creates the output directory if it does not exist.
 *
 * @param rows - The resolved report rows to write
 * @param outputPath - Absolute path for the output CSV file
 */
export async function writeCSV(
  rows: RefReportRow[],
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  const headerLine = CSV_HEADERS.join(",");
  const dataLines = rows.map((row) =>
    rowToFields(row).map(escapeCSVField).join(","),
  );

  const content = [headerLine, ...dataLines].join("\n") + "\n";
  await writeFile(outputPath, content, "utf-8");
}
