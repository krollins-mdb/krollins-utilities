import * as path from "path";
import { FileMapping } from "./types.js";

/**
 * Resolves a source file path to a production URL
 * @param filePath - Absolute path to the source file
 * @param sourceDir - Absolute path to the source directory
 * @param baseUrl - Base production URL
 * @returns Production URL for the file
 */
export function resolveFileToUrl(
  filePath: string,
  sourceDir: string,
  baseUrl: string,
): string {
  // Get the relative path from source directory
  const relativePath = path.relative(sourceDir, filePath);

  // Remove the .txt extension and split into parts
  const withoutExt = relativePath.replace(/\.txt$/, "");

  // If it's index.txt at the root, return the base URL
  if (withoutExt === "index") {
    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  // Build the URL by appending path segments
  const urlPath = withoutExt.split(path.sep).join("/");
  const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return `${trimmedBase}/${urlPath}/`;
}

/**
 * Maps an array of source file paths to production URLs
 * @param filePaths - Array of absolute file paths
 * @param sourceDir - Absolute path to the source directory
 * @param baseUrl - Base production URL
 * @returns Array of file mappings
 */
export function mapFilesToUrls(
  filePaths: string[],
  sourceDir: string,
  baseUrl: string,
): FileMapping[] {
  return filePaths.map((filePath) => ({
    sourcePath: filePath,
    productionUrl: resolveFileToUrl(filePath, sourceDir, baseUrl),
  }));
}
