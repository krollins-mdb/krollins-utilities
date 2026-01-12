/**
 * CLI entry point for Jira report generator
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { parseJiraCSV, validateParsedIssues } from "./parser.js";
import {
  transformIssues,
  filterByYear,
  filterByAssignee,
  filterByProject,
  setComplexityThresholds,
} from "./transformer.js";
import type { JiraIssue } from "./types.js";

const program = new Command();

program
  .name("jira-report")
  .description("Generate HTML retrospective report from Jira CSV export")
  .version("1.0.0")
  .requiredOption("-i, --input <path>", "Path to Jira CSV export file")
  .option("-o, --output <path>", "Output HTML file path", "report.html")
  .option("-y, --year <year>", "Filter by year", parseInt)
  .option("-a, --assignee <email>", "Filter by assignee email")
  .option("-p, --project <label>", "Filter by project label")
  .option("-t, --title <title>", "Report title", "Team Retrospective")
  .option(
    "--high-threshold <points>",
    "Story points threshold for high complexity (default: 8)",
    parseFloat,
    8
  )
  .option(
    "--medium-threshold <points>",
    "Story points threshold for medium complexity (default: 3)",
    parseFloat,
    3
  )
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    console.log("📊 Jira Retrospective Report Generator\n");

    // Validate input file exists
    if (!existsSync(options.input)) {
      console.error(`❌ Error: Input file not found: ${options.input}`);
      console.error(
        "\nPlease check the file path and try again. Use --help for usage information."
      );
      process.exit(1);
    }

    // Configure complexity thresholds
    if (options.highThreshold || options.mediumThreshold) {
      setComplexityThresholds(options.highThreshold, options.mediumThreshold);
      console.log(
        `⚙️  Custom thresholds: High ≥${options.highThreshold}pts, Medium ≥${options.mediumThreshold}pts\n`
      );
    }

    // Phase 1: Parse CSV
    console.log(`📄 Reading CSV file: ${options.input}`);
    const parsedIssues = await parseJiraCSV(options.input);
    console.log(`✓ Parsed ${parsedIssues.length} issues`);

    // Validate parsed data
    validateParsedIssues(parsedIssues);
    console.log("✓ Data validation passed\n");

    // Phase 2: Transform data
    console.log("🔄 Transforming data...");
    let issues: JiraIssue[] = transformIssues(parsedIssues);

    // Apply filters
    if (options.year) {
      issues = filterByYear(issues, options.year);
      console.log(
        `✓ Filtered to year ${options.year}: ${issues.length} issues`
      );
    }

    if (options.assignee) {
      issues = filterByAssignee(issues, options.assignee);
      console.log(
        `✓ Filtered to assignee "${options.assignee}": ${issues.length} issues`
      );
    }

    if (options.project) {
      issues = filterByProject(issues, options.project);
      console.log(
        `✓ Filtered to project "${options.project}": ${issues.length} issues`
      );
    }

    if (issues.length === 0) {
      console.error(
        "\n❌ No issues found after filtering. Please check your filter criteria."
      );
      process.exit(1);
    }

    console.log(`\n✓ Final dataset: ${issues.length} issues\n`);

    // Phase 3: Analyze
    const { analyzeIssues, printAnalysisSummary } = await import(
      "./analyze.js"
    );
    const analysisResult = analyzeIssues(issues);

    // Print summary to console
    printAnalysisSummary(analysisResult);

    // Phase 4: Generate HTML
    const { generateHTMLReport } = await import("./htmlGenerator.js");
    await generateHTMLReport(analysisResult, options.output, options.title);

    // Get the directory name from the output path
    const reportDir = options.output.replace(/\.html$/, "");

    console.log("✅ Report Complete!");
    console.log(
      `   Open ${reportDir}/index.html in your browser to view the report.`
    );
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error
    );

    // Provide helpful context based on error type
    if (error instanceof Error) {
      if (
        error.message.includes("ENOENT") ||
        error.message.includes("no such file")
      ) {
        console.error(
          "\n💡 Tip: Make sure the CSV file path is correct and the file exists."
        );
      } else if (
        error.message.includes("permission") ||
        error.message.includes("EACCES")
      ) {
        console.error(
          "\n💡 Tip: Check file permissions. You may need read access to the input file or write access to the output directory."
        );
      } else if (
        error.message.includes("parse") ||
        error.message.includes("CSV")
      ) {
        console.error(
          "\n💡 Tip: Ensure the CSV file is properly formatted and exported from Jira."
        );
      }
    }

    console.error("\nUse --help for usage information.\n");
    process.exit(1);
  }
}

main();
