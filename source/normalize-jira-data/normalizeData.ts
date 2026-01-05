import * as fs from "fs";
import * as path from "path";

interface CsvRow {
  [key: string]: string;
}

/**
 * Properly parse a CSV line, handling quoted values with commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quote (double quotes)
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current); // Add last field

  return result;
}

/**
 * Escape and quote a CSV field if needed
 */
function escapeCsvField(field: string): string {
  // If field contains comma, quote, or newline, it needs to be quoted
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    // Escape quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return field;
}

/**
 * Merges multiple "Labels" columns in a CSV into a single comma-separated column
 */
function mergeLabelsInCsv(inputPath: string, outputPath: string): void {
  // Read the CSV file
  const fileContent = fs.readFileSync(inputPath, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    console.error("CSV file is empty");
    return;
  }

  // Parse header
  const header = parseCsvLine(lines[0]);

  // Find all "Labels" column indices
  const labelIndices: number[] = [];
  const nonLabelColumns: Array<{ name: string; index: number }> = [];
  let assigneeColumnIndex = -1;

  header.forEach((col, index) => {
    if (col.trim() === "Labels") {
      labelIndices.push(index);
    } else {
      nonLabelColumns.push({ name: col, index });
      if (col.trim() === "Assignee") {
        assigneeColumnIndex = index;
      }
    }
  });

  if (labelIndices.length === 0) {
    console.error('No "Labels" columns found in CSV');
    return;
  }

  console.log(
    `Found ${
      labelIndices.length
    } "Labels" columns at indices: ${labelIndices.join(", ")}`
  );

  // Build new header
  const newHeader = [...nonLabelColumns.map((col) => col.name), "Labels"];

  // Process data rows
  const newRows: string[][] = [];
  const rowsMissingAssignee: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);

    // Extract non-label columns, preserving their values (including empty strings)
    const newRow = nonLabelColumns.map((col) => {
      const value = row[col.index];
      return value !== undefined ? value : "";
    });

    // Extract and merge label values (filter out empty ones)
    const labels = labelIndices
      .map((index) => row[index]?.trim())
      .filter((label) => label && label.length > 0);

    // Add merged labels as the last column
    const mergedLabels = labels.join(", ");
    newRow.push(mergedLabels);

    // Check if assignee exists
    if (assigneeColumnIndex >= 0) {
      const assignee = row[assigneeColumnIndex]?.trim() || "";
      if (!assignee.includes("@mongodb.com")) {
        rowsMissingAssignee.push(i + 1); // +1 for 1-based line numbers
      }
    }

    newRows.push(newRow);
  }

  // Write output CSV with proper escaping
  const outputLines = [
    newHeader.map(escapeCsvField).join(","),
    ...newRows.map((row) => row.map(escapeCsvField).join(",")),
  ];

  fs.writeFileSync(outputPath, outputLines.join("\n"), "utf-8");

  console.log(`✅ Successfully merged ${labelIndices.length} "Labels" columns`);
  console.log(`📄 Input: ${inputPath}`);
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Processed ${newRows.length} data rows`);

  // Report assignee validation results
  if (assigneeColumnIndex >= 0) {
    if (rowsMissingAssignee.length === 0) {
      console.log(`✅ All rows have valid assignees`);
    } else {
      console.log(
        `⚠️  Found ${rowsMissingAssignee.length} row(s) without assignee (@mongodb.com)`
      );
      console.log(
        `   Line numbers: ${rowsMissingAssignee.slice(0, 10).join(", ")}${
          rowsMissingAssignee.length > 10 ? "..." : ""
        }`
      );
    }
  } else {
    console.log(`⚠️  No "Assignee" column found in CSV`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log("Usage: ts-node mergeLabels.ts <input.csv> [output.csv]");
  console.log("");
  console.log("Example:");
  console.log(
    "  ts-node mergeLabels.ts jira-2024-resolved.csv jira-2024-merged.csv"
  );
  console.log("");
  console.log(
    "If output file is not specified, it will be named <input>-merged.csv"
  );
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1]
  ? path.resolve(args[1])
  : inputPath.replace(/\.csv$/i, "-merged.csv");

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Input file not found: ${inputPath}`);
  process.exit(1);
}

try {
  mergeLabelsInCsv(inputPath, outputPath);
} catch (error) {
  console.error("❌ Error processing CSV:", error);
  process.exit(1);
}
