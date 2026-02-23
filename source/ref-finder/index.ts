/**
 * CLI entry point for the Ref Finder tool.
 *
 * Orchestrates the four-step pipeline:
 * 1. Collect App Services ref declarations
 * 2. Collect Atlas Triggers ref declarations
 * 3. Determine exists-in-atlas for each App Services ref
 * 4. Find App Services ref invocations in Triggers content
 *
 * Outputs a CSV report to source/ref-finder/output/refs.csv.
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  findTxtFiles,
  extractRefDeclarations,
  extractRefInvocations,
} from "./scanner.js";
import {
  buildAtlasLookup,
  groupInvocationsByRef,
  resolveReportRows,
} from "./matcher.js";
import { writeCSV } from "./csv-writer.js";
import type { RefDeclaration, RefInvocation } from "./types.js";

/** Relative content paths within the docs-mongodb-internal repo. */
const APP_SERVICES_PATH = "content/app-services/source";
const ATLAS_TRIGGERS_PATH = "content/atlas/source/atlas-ui/triggers";

/** Resolve the default docs repo path as a sibling directory. */
function resolveDefaultDocsRepo(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // Walk up from dist/source/ref-finder/ to the repo root, then look
  // for docs-mongodb-internal as a sibling.
  const repoRoot = resolve(__dirname, "..", "..", "..");
  return resolve(repoRoot, "..", "docs-mongodb-internal");
}

/** Resolve the output CSV path relative to this script's source location. */
function resolveOutputPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // When running from dist/, walk up to the repo root and reference
  // the source directory for output.
  const repoRoot = resolve(__dirname, "..", "..", "..");
  return join(repoRoot, "source", "ref-finder", "output", "refs.csv");
}

/**
 * Main pipeline: scan, match, and write the CSV report.
 */
async function run(docsRepo: string): Promise<void> {
  const appServicesDir = resolve(docsRepo, APP_SERVICES_PATH);
  const atlasTriggersDir = resolve(docsRepo, ATLAS_TRIGGERS_PATH);

  // Validate directories exist
  if (!existsSync(appServicesDir)) {
    throw new Error(
      `App Services directory not found: ${appServicesDir}\n` +
        `Ensure --docs-repo points to the docs-mongodb-internal root.`,
    );
  }
  if (!existsSync(atlasTriggersDir)) {
    throw new Error(
      `Atlas Triggers directory not found: ${atlasTriggersDir}\n` +
        `Ensure --docs-repo points to the docs-mongodb-internal root.`,
    );
  }

  // Step 1: Collect App Services ref declarations
  console.log("Step 1: Scanning App Services content for ref declarations...");
  const appServicesTxtFiles = await findTxtFiles(appServicesDir);
  console.log(`  Found ${appServicesTxtFiles.length} .txt files`);

  const appServicesRefs: RefDeclaration[] = [];
  for (const filePath of appServicesTxtFiles) {
    const declarations = await extractRefDeclarations(
      filePath,
      docsRepo,
      "app-services",
    );
    appServicesRefs.push(...declarations);
  }
  console.log(`  Extracted ${appServicesRefs.length} ref declarations`);

  // Step 2: Collect Atlas Triggers ref declarations
  console.log(
    "Step 2: Scanning Atlas Triggers content for ref declarations...",
  );
  const triggersTxtFiles = await findTxtFiles(atlasTriggersDir);
  console.log(`  Found ${triggersTxtFiles.length} .txt files`);

  const triggersRefs: RefDeclaration[] = [];
  for (const filePath of triggersTxtFiles) {
    const declarations = await extractRefDeclarations(
      filePath,
      docsRepo,
      "atlas",
    );
    triggersRefs.push(...declarations);
  }
  console.log(`  Extracted ${triggersRefs.length} ref declarations`);

  // Build Atlas lookup set (prefix stripped)
  const atlasLookup = buildAtlasLookup(triggersRefs);
  console.log(`  Built lookup set with ${atlasLookup.size} unique ref names`);

  // Step 3 + 4: Find invocations in Triggers content and resolve rows
  console.log(
    "Step 3: Scanning Triggers content for App Services ref invocations...",
  );
  const allInvocations: RefInvocation[] = [];
  for (const filePath of triggersTxtFiles) {
    const invocations = await extractRefInvocations(filePath, docsRepo);
    allInvocations.push(...invocations);
  }
  console.log(`  Found ${allInvocations.length} ref invocations`);

  // Filter to only invocations of App Services refs
  const appServicesRefNames = new Set(appServicesRefs.map((r) => r.refName));
  const relevantInvocations = allInvocations.filter((inv) =>
    appServicesRefNames.has(inv.refName),
  );
  console.log(
    `  ${relevantInvocations.length} invocations reference App Services refs`,
  );

  // Group invocations by ref name
  const invocationsByRef = groupInvocationsByRef(relevantInvocations);

  // Resolve final report rows
  console.log("Step 4: Resolving report rows...");
  const reportRows = resolveReportRows(
    appServicesRefs,
    atlasLookup,
    invocationsByRef,
  );

  // Write CSV
  const outputPath = resolveOutputPath();
  await writeCSV(reportRows, outputPath);

  // Summary
  const withAtlas = reportRows.filter((r) => r.existsInAtlas).length;
  const withInvocations = reportRows.filter(
    (r) => r.triggersInvocations.length > 0,
  ).length;

  console.log(`\nDone. Wrote ${reportRows.length} rows to ${outputPath}`);
  console.log(`  ${withAtlas} refs have an atlas- counterpart`);
  console.log(`  ${withInvocations} refs are invoked in Triggers content`);
}

// --- CLI setup ---

const program = new Command();

program
  .name("ref-finder")
  .description(
    "Analyze reStructuredText ref declarations across App Services and Atlas Triggers docs",
  )
  .option(
    "--docs-repo <path>",
    "Absolute path to the docs-mongodb-internal repo",
    resolveDefaultDocsRepo(),
  )
  .action(async (options: { docsRepo: string }) => {
    try {
      const docsRepo = resolve(options.docsRepo);
      console.log(`Using docs repo: ${docsRepo}\n`);
      await run(docsRepo);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("An unexpected error occurred:", error);
      }
      process.exit(1);
    }
  });

program.parse();
