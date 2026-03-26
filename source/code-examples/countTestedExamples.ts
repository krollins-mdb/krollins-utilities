import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// --- Argument parsing ---

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
};

const startDate = getArg("--start");
const endDate = getArg("--end");
const searchRoot =
  args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--start" && args[args.indexOf(a) - 1] !== "--end") ||
  process.env.HOME + "/Documents/GitHub";

// --- Repo/path discovery ---

const getRepoAndSubpath = async (
  startDir: string,
): Promise<{ repoRoot: string; subPath: string } | null> => {
  const target = "docs-mongodb-internal";
  const subPath = "content/code-examples/tested";

  const searchRecursively = async (dir: string): Promise<string | null> => {
    if (path.basename(dir) === target) return dir;

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dir, entry.name);
          if (path.basename(fullPath) === target) return fullPath;
          const found = await searchRecursively(fullPath);
          if (found) return found;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const repoRoot = await searchRecursively(startDir);
  if (!repoRoot) return null;
  return { repoRoot, subPath };
};

const location = await getRepoAndSubpath(searchRoot);

if (!location) {
  console.error("Error: Could not find docs-mongodb-internal repository.");
  console.error("Searched in:", searchRoot);
  process.exit(1);
}

const { repoRoot, subPath } = location;

// --- Git helpers ---

const getCommitAtDate = (date: string): string => {
  try {
    const commit = execSync(
      `git -C "${repoRoot}" log --before="${date}" -1 --format=%H`,
      { encoding: "utf8" },
    ).trim();
    if (!commit) {
      console.error(`Error: No commits found before ${date}`);
      process.exit(1);
    }
    return commit;
  } catch {
    console.error(`Error: Failed to get commit for date ${date}`);
    process.exit(1);
  }
};

const listFilesAtCommit = (commit: string): string[] => {
  try {
    const output = execSync(
      `git -C "${repoRoot}" ls-tree -r --name-only "${commit}" "${subPath}"`,
      { encoding: "utf8" },
    ).trim();
    return output ? output.split("\n") : [];
  } catch {
    return [];
  }
};

// --- Counting logic ---

type DirectoryCounts = Record<string, number>;

const bucketByDirectory = (files: string[]): DirectoryCounts => {
  const counts: DirectoryCounts = {};

  for (const file of files) {
    // Strip the subPath prefix: content/code-examples/tested/
    const relative = file.slice(subPath.length + 1);
    const parts = relative.split("/");

    // Match the original logic: top-level dir, optionally broken out by subdir
    if (parts.length >= 3) {
      // Has at least top/sub/file — use top/sub as key
      const key = `${parts[0]}/${parts[1]}`;
      counts[key] = (counts[key] ?? 0) + 1;
    } else if (parts.length === 2) {
      // top/file — use top as key
      counts[parts[0]] = (counts[parts[0]] ?? 0) + 1;
    }
  }

  return counts;
};

// --- Filesystem snapshot (current state) ---

const countAllFiles = async (dirPath: string): Promise<number> => {
  let count = 0;
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        count++;
      } else if (entry.isDirectory()) {
        count += await countAllFiles(path.join(dirPath, entry.name));
      }
    }
  } catch {
    return 0;
  }
  return count;
};

const generateSnapshotReport = async () => {
  const basePath = path.join(repoRoot, subPath);
  const counts: DirectoryCounts = {};
  let total = 0;

  try {
    const entries = await fs.promises.readdir(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(basePath, entry.name);
        const subEntries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const hasSubdirectories = subEntries.some((e) => e.isDirectory());

        if (hasSubdirectories) {
          for (const subEntry of subEntries) {
            if (subEntry.isDirectory()) {
              const subDirPath = path.join(dirPath, subEntry.name);
              const count = await countAllFiles(subDirPath);
              const key = `${entry.name}/${subEntry.name}`;
              counts[key] = count;
              total += count;
            }
          }
        } else {
          const count = await countAllFiles(dirPath);
          counts[entry.name] = count;
          total += count;
        }
      }
    }
  } catch (error) {
    console.error("Error reading directory:", error);
    process.exit(1);
  }

  console.log("\n=== Code Example Files Report (current) ===\n");
  const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  for (const [dir, count] of sorted) {
    console.log(`${dir.padEnd(30)} ${count.toString().padStart(5)} files`);
  }
  console.log("-".repeat(40));
  console.log(`${"Total".padEnd(30)} ${total.toString().padStart(5)} files`);
  console.log();
};

// --- Time range comparison report ---

const generateRangeReport = (start: string, end: string) => {
  const startCommit = getCommitAtDate(start);
  const endCommit = getCommitAtDate(end);

  const startFiles = listFilesAtCommit(startCommit);
  const endFiles = listFilesAtCommit(endCommit);

  const startCounts = bucketByDirectory(startFiles);
  const endCounts = bucketByDirectory(endFiles);

  const allKeys = new Set([...Object.keys(startCounts), ...Object.keys(endCounts)]);
  const sorted = [...allKeys].sort((a, b) => a.localeCompare(b));

  const startTotal = Object.values(startCounts).reduce((s, n) => s + n, 0);
  const endTotal = Object.values(endCounts).reduce((s, n) => s + n, 0);
  const netTotal = endTotal - startTotal;

  console.log(`\n=== Code Example Files Report (${start} → ${end}) ===\n`);
  console.log(
    `${"Directory".padEnd(30)} ${"Start".padStart(7)} ${"End".padStart(7)} ${"Change".padStart(8)}`,
  );
  console.log("-".repeat(56));

  for (const key of sorted) {
    const s = startCounts[key] ?? 0;
    const e = endCounts[key] ?? 0;
    const delta = e - s;
    const deltaStr = delta === 0 ? "" : delta > 0 ? `+${delta}` : `${delta}`;
    console.log(
      `${key.padEnd(30)} ${s.toString().padStart(7)} ${e.toString().padStart(7)} ${deltaStr.padStart(8)}`,
    );
  }

  console.log("-".repeat(56));
  const netStr = netTotal === 0 ? "" : netTotal > 0 ? `+${netTotal}` : `${netTotal}`;
  console.log(
    `${"Total".padEnd(30)} ${startTotal.toString().padStart(7)} ${endTotal.toString().padStart(7)} ${netStr.padStart(8)}`,
  );
  console.log();
  console.log(`Start commit: ${startCommit.slice(0, 10)} (${start})`);
  console.log(`End commit:   ${endCommit.slice(0, 10)} (${end})`);
  console.log();
};

// --- Main ---

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

const lastDays = args.includes("--last-7-days");

if (startDate || endDate) {
  if (!startDate || !endDate) {
    console.error("Error: Both --start and --end are required for range mode.");
    console.error("Usage: countTestedExamples.ts --start 2025-01-01 --end 2025-06-01");
    process.exit(1);
  }
  generateRangeReport(startDate, endDate);
} else if (lastDays) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  generateRangeReport(toISODate(start), toISODate(end));
} else {
  await generateSnapshotReport();
}
