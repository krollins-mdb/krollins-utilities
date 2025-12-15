import * as fs from "fs";
import * as path from "path";

const getCodeExampleTestsPath = async (
  startDir: string = process.cwd()
): Promise<string | null> => {
  const searchRecursively = async (dir: string): Promise<string | null> => {
    // Check if the current directory itself matches the pattern
    if (dir.endsWith("docs-mongodb-internal/content/code-examples/tested")) {
      return dir;
    }

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dir, entry.name);

          // Check if this directory matches the pattern
          if (
            fullPath.endsWith(
              "docs-mongodb-internal/content/code-examples/tested"
            )
          ) {
            return fullPath;
          }

          // Recursively search in subdirectories
          const found = await searchRecursively(fullPath);
          if (found) {
            return found;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't access
      return null;
    }

    return null;
  };

  return searchRecursively(startDir);
};

const BASE_PATH = await getCodeExampleTestsPath(
  process.argv[2] || process.env.HOME + "/Documents/GitHub"
);

if (!BASE_PATH) {
  console.error(
    "Error: Could not find docs-mongodb-internal/content/code-examples/tested directory."
  );
  console.error(
    "Searched in:",
    process.argv[2] || process.env.HOME + "/Documents/GitHub"
  );
  process.exit(1);
}

const countAllFiles = async (dirPath: string): Promise<number> => {
  let count = 0;

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        count++;
      } else if (entry.isDirectory()) {
        const fullPath = path.join(dirPath, entry.name);
        count += await countAllFiles(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't access
    return 0;
  }

  return count;
};

const generateReport = async (basePath: string) => {
  const counts: Record<string, number> = {};
  let total = 0;

  try {
    const entries = await fs.promises.readdir(basePath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(basePath, entry.name);
        const count = await countAllFiles(dirPath);
        counts[entry.name] = count;
        total += count;
      }
    }
  } catch (error) {
    console.error("Error reading base path:", error);
    process.exit(1);
  }

  // Display the report
  console.log("\n=== Code Example Files Report ===\n");

  // Sort by directory name for consistent output
  const sortedEntries = Object.entries(counts).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  for (const [dir, count] of sortedEntries) {
    console.log(`${dir.padEnd(20)} ${count.toString().padStart(5)} files`);
  }

  console.log("-".repeat(35));
  console.log(`${"Total".padEnd(20)} ${total.toString().padStart(5)} files`);
  console.log();
};

await generateReport(BASE_PATH);
