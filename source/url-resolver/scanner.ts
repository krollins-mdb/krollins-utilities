import * as fs from "fs";
import * as path from "path";

/**
 * Recursively scans a directory for .txt files
 * @param dirPath - The directory to scan
 * @returns Array of absolute file paths to .txt files
 */
export function scanForTxtFiles(dirPath: string): string[] {
  const txtFiles: string[] = [];

  function scanDirectory(currentPath: string): void {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith(".txt")) {
        txtFiles.push(fullPath);
      }
    }
  }

  scanDirectory(dirPath);
  return txtFiles;
}
