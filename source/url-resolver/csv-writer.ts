import * as fs from "fs";
import * as path from "path";
import { FileMapping } from "./types.js";

/**
 * Writes file mappings to a CSV file
 * @param mappings - Array of file mappings
 * @param outputPath - Path to the output CSV file
 * @param repoRoot - Root path of the docs repo, used to relativize source paths
 */
export function writeToCsv(
  mappings: FileMapping[],
  outputPath: string,
  repoRoot: string,
): void {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create CSV content
  const header = "Source File Path,Production URL,Is Valid\n";
  const rows = mappings.map((mapping) => {
    // Relativize source path to the repo root
    const sourcePath = `"${path.relative(repoRoot, mapping.sourcePath)}"`;
    const productionUrl = `"${mapping.productionUrl}"`;
    const isValid =
      mapping.isValid !== undefined ? String(mapping.isValid) : "";
    return `${sourcePath},${productionUrl},${isValid}`;
  });

  const csvContent = header + rows.join("\n");

  // Write to file
  fs.writeFileSync(outputPath, csvContent, "utf-8");
  console.log(`CSV file written to: ${outputPath}`);
  console.log(`Total files mapped: ${mappings.length}`);
}
