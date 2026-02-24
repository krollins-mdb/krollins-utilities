import * as path from "path";
import { fileURLToPath } from "url";
import { scanForTxtFiles } from "./scanner.js";
import { mapFilesToUrls } from "./resolver.js";
import { validateUrls } from "./validator.js";
import { writeToCsv } from "./csv-writer.js";
import { ResolverConfig } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main function to resolve source files to production URLs and output to CSV
 */
async function main(): Promise<void> {
  // Configuration
  // Navigate from dist/source/url-resolver -> dist/source -> dist -> krollins-utilities -> GitHub -> docs-mongodb-internal
  const workspaceRoot = path.join(path.dirname(__dirname), "..", "..");

  const config: ResolverConfig = {
    sourceDir: path.join(
      workspaceRoot,
      "..",
      "docs-mongodb-internal",
      "content",
      "app-services",
      "source",
    ),
    baseUrl: "https://www.mongodb.com/docs/atlas/app-services",
    outputCsvPath: path.join(
      workspaceRoot,
      "source",
      "url-resolver",
      "output",
      "app-services-urls.csv",
    ),
  };

  const repoRoot = path.join(workspaceRoot, "..", "docs-mongodb-internal");

  console.log("Starting URL resolution...");
  console.log(`Source directory: ${config.sourceDir}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log("");

  // Step 1: Scan for .txt files
  console.log("Scanning for .txt files...");
  const txtFiles = scanForTxtFiles(config.sourceDir);
  console.log(`Found ${txtFiles.length} .txt files`);
  console.log("");

  // Step 2: Map files to URLs
  console.log("Mapping files to production URLs...");
  const mappings = mapFilesToUrls(txtFiles, config.sourceDir, config.baseUrl);
  console.log("");

  // Step 3: Validate URLs
  console.log("Validating URLs against live site...");
  const validatedMappings = await validateUrls(mappings);
  console.log("");

  // Step 4: Write to CSV
  console.log("Writing to CSV...");
  writeToCsv(validatedMappings, config.outputCsvPath, repoRoot);
  console.log("");
  console.log("Done!");
}

// Run the script
main();
