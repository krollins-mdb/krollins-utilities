import * as fs from "fs";
import * as path from "path";

interface JiraTicket {
  "Issue Type": string;
  Priority: string;
  Summary: string;
  Assignee: string;
  "Custom field (Story Points)": string;
  Resolved: string;
  Created: string;
}

interface MonthlyVelocity {
  month: string;
  totalStoryPoints: number;
  ticketCount: number;
}

/**
 * Parse date string in format "Feb 27 2025 07:21:15 AM CST" and extract month
 */
function parseMonth(dateString: string): string {
  if (!dateString || dateString.trim() === "") {
    return "Unknown";
  }

  const parts = dateString.trim().split(" ");
  if (parts.length < 2) {
    return "Unknown";
  }

  return parts[0]; // Returns month abbreviation like "Feb", "Mar", etc.
}

/**
 * Parse CSV content and aggregate by month
 */
function aggregateByMonth(csvContent: string): MonthlyVelocity[] {
  const lines = csvContent.split("\n");

  if (lines.length < 2) {
    return [];
  }

  // Parse header row to find column indices
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const storyPointsIndex = headers.indexOf("Custom field (Story Points)");
  const resolvedIndex = headers.indexOf("Resolved");

  if (storyPointsIndex === -1 || resolvedIndex === -1) {
    console.error("Error: Required columns not found in CSV");
    console.error(`Story Points column index: ${storyPointsIndex}`);
    console.error(`Resolved column index: ${resolvedIndex}`);
    process.exit(1);
  }

  // Skip header row
  const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

  const monthlyData: Map<string, { totalPoints: number; count: number }> =
    new Map();

  for (const line of dataLines) {
    // Split by comma but handle quoted fields
    const fields = parseCSVLine(line);

    if (fields.length <= Math.max(storyPointsIndex, resolvedIndex)) {
      continue; // Skip malformed lines
    }

    const storyPointsStr = fields[storyPointsIndex];
    const resolvedDate = fields[resolvedIndex];

    const storyPoints =
      storyPointsStr && storyPointsStr.trim() !== ""
        ? parseFloat(storyPointsStr)
        : 0;

    const month = parseMonth(resolvedDate);

    if (month === "Unknown") {
      continue; // Skip tickets without valid resolved date
    }

    if (!monthlyData.has(month)) {
      monthlyData.set(month, { totalPoints: 0, count: 0 });
    }

    const data = monthlyData.get(month)!;
    data.totalPoints += isNaN(storyPoints) ? 0 : storyPoints;
    data.count += 1;
  }

  // Convert to array and sort by month order
  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const result: MonthlyVelocity[] = [];
  for (const month of monthOrder) {
    if (monthlyData.has(month)) {
      const data = monthlyData.get(month)!;
      result.push({
        month,
        totalStoryPoints: Math.round(data.totalPoints * 10) / 10, // Round to 1 decimal
        ticketCount: data.count,
      });
    }
  }

  return result;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }

  fields.push(currentField); // Add last field

  return fields;
}

/**
 * Write results to CSV file
 */
function writeToCSV(data: MonthlyVelocity[], outputPath: string): void {
  const header = "Month,Total Story Points,Ticket Count\n";
  const rows = data
    .map((row) => `${row.month},${row.totalStoryPoints},${row.ticketCount}`)
    .join("\n");

  fs.writeFileSync(outputPath, header + rows);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: ts-node createVelocityReport.ts <input-csv-file>");
    console.error(
      "Example: ts-node createVelocityReport.ts input/jira-2025-resolved.csv"
    );
    process.exit(1);
  }

  const inputFile = args[0];
  const inputPath = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading data from: ${inputPath}`);

  const csvContent = fs.readFileSync(inputPath, "utf-8");
  const velocityData = aggregateByMonth(csvContent);

  // Determine output filename
  const inputFilename = path.basename(inputFile, ".csv");
  const outputDir = path.resolve(process.cwd(), "output");
  const outputPath = path.join(outputDir, `${inputFilename}-velocity.csv`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  writeToCSV(velocityData, outputPath);

  console.log(`\nVelocity Report Generated:`);
  console.log(`Output file: ${outputPath}\n`);
  console.log("Summary:");
  console.log("Month\tStory Points\tTickets");
  console.log("-----\t------------\t-------");
  velocityData.forEach((row) => {
    console.log(`${row.month}\t${row.totalStoryPoints}\t\t${row.ticketCount}`);
  });

  const totalPoints = velocityData.reduce(
    (sum, row) => sum + row.totalStoryPoints,
    0
  );
  const totalTickets = velocityData.reduce(
    (sum, row) => sum + row.ticketCount,
    0
  );
  console.log("-----\t------------\t-------");
  console.log(`Total\t${Math.round(totalPoints * 10) / 10}\t\t${totalTickets}`);
}

main();
