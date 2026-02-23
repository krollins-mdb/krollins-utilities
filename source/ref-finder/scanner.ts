/**
 * File discovery and ref extraction.
 *
 * Provides functions to:
 * - Recursively find all .txt files in a directory
 * - Extract ref declarations (`.. _<name>:`) from file contents
 * - Extract ref invocations (`:ref:\`...\``) from file contents
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import type { RefDeclaration, RefInvocation } from "./types.js";

/** Regex for ref declarations: `.. _<REF-NAME>:` at the start of a line. */
const REF_DECLARATION_PATTERN = /^\.\. _([^:]+):$/;

/**
 * Regex for ref invocations: `:ref:\`<DISPLAY> <REF>\`` or `:ref:\`<REF>\``.
 *
 * Captures the ref name from either form:
 * - `:ref:\`Some Display Text <ref-name>\`` → captures "ref-name"
 * - `:ref:\`ref-name\`` → captures "ref-name"
 *
 * Uses the global flag to find multiple invocations per line.
 */
const REF_INVOCATION_PATTERN = /:ref:`(?:[^<`]*<)?([^>`]+)>?`/g;

/**
 * Recursively find all .txt files under the given directory.
 *
 * @param dirPath - Absolute path to the directory to scan
 * @returns Array of absolute file paths
 */
export async function findTxtFiles(dirPath: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      const nested = await findTxtFiles(fullPath);
      results.push(...nested);
    } else if (entry.endsWith(".txt")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Extract all ref declarations from a single file.
 *
 * Scans each line for the pattern `.. _<REF-NAME>:` and returns
 * a RefDeclaration for each match.
 *
 * @param filePath - Absolute path to the .txt file
 * @param docsRepoRoot - Absolute path to the docs-mongodb-internal repo root
 * @param docsProject - The project name (e.g. "app-services")
 * @returns Array of RefDeclaration objects found in the file
 */
export async function extractRefDeclarations(
  filePath: string,
  docsRepoRoot: string,
  docsProject: string,
): Promise<RefDeclaration[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const declarations: RefDeclaration[] = [];
  const relativePath = relative(docsRepoRoot, filePath);

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(REF_DECLARATION_PATTERN);

    if (match) {
      declarations.push({
        refName: match[1],
        refString: trimmed,
        docsProject,
        sourcePage: relativePath,
      });
    }
  }

  return declarations;
}

/**
 * Extract all ref invocations from a single file.
 *
 * Scans each line for `:ref:\`...\`` patterns and returns a
 * RefInvocation for each match.
 *
 * @param filePath - Absolute path to the .txt file
 * @param docsRepoRoot - Absolute path to the docs-mongodb-internal repo root
 * @returns Array of RefInvocation objects found in the file
 */
export async function extractRefInvocations(
  filePath: string,
  docsRepoRoot: string,
): Promise<RefInvocation[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const invocations: RefInvocation[] = [];
  const relativePath = relative(docsRepoRoot, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Reset lastIndex for the global regex before each line
    REF_INVOCATION_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = REF_INVOCATION_PATTERN.exec(line)) !== null) {
      invocations.push({
        refName: match[1],
        sourcePage: relativePath,
        line: i + 1, // 1-based line number
      });
    }
  }

  return invocations;
}
