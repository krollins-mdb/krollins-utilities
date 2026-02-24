import { FileMapping } from "./types.js";

// Number of concurrent requests to avoid overwhelming the server
const CONCURRENCY_LIMIT = 10;

// Delay in ms between batches to avoid rate limiting
const BATCH_DELAY_MS = 500;

/**
 * Pauses execution for a given number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if a single URL resolves successfully (no 404 or network error)
 * Uses a HEAD request for efficiency, falls back to GET if HEAD is not allowed
 * @param url - The URL to validate
 * @returns true if the URL resolves, false otherwise
 */
async function isUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    // If HEAD is not allowed, try GET
    if (response.status === 405) {
      const getResponse = await fetch(url, {
        method: "GET",
        redirect: "follow",
      });
      return getResponse.ok;
    }

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validates URLs in batches to limit concurrency
 * @param mappings - Array of file mappings to validate
 * @returns The same mappings with isValid populated
 */
export async function validateUrls(
  mappings: FileMapping[],
): Promise<FileMapping[]> {
  const results: FileMapping[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < mappings.length; i += CONCURRENCY_LIMIT) {
    const batch = mappings.slice(i, i + CONCURRENCY_LIMIT);

    const batchResults = await Promise.all(
      batch.map(async (mapping) => {
        const isValid = await isUrlValid(mapping.productionUrl);
        return { ...mapping, isValid };
      }),
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
    }

    // Progress update
    const processed = Math.min(i + CONCURRENCY_LIMIT, mappings.length);
    process.stdout.write(`\rValidated ${processed}/${mappings.length} URLs...`);

    // Delay between batches to avoid rate limiting
    if (i + CONCURRENCY_LIMIT < mappings.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(""); // newline after progress
  console.log(`  Valid: ${validCount}`);
  console.log(`  Invalid: ${invalidCount}`);

  return results;
}
