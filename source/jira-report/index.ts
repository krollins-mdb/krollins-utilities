/**
 * CLI entry point for Jira report generator
 */

import { Command } from "commander";
import { parseJiraCSV, validateParsedIssues } from "./parser.js";
import {
  transformIssues,
  filterByYear,
  filterByAssignee,
  filterByProject,
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
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    console.log("📊 Jira Retrospective Report Generator\n");

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

    // Phase 3: Analyze (TODO - Phase 2 implementation)
    console.log("📈 Analysis phase not yet implemented");
    console.log("   This will be completed in Phase 2\n");

    // Phase 4: Generate HTML (TODO - Phase 3 implementation)
    console.log("🎨 HTML generation not yet implemented");
    console.log("   This will be completed in Phase 3\n");

    console.log("✅ Phase 1 Complete!");
    console.log(
      "   CSV parsing and data transformation are working correctly."
    );
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
