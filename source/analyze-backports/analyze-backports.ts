import { readFileSync, readdirSync, existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { BackportConfig, ProjectAnalysis } from "./types.js";
import { generateMarkdownReport } from "./markdown-report.js";

// ── CLI ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const reportFlag = args.includes("--report");
const repoPath = args.find((a) => !a.startsWith("--"));

if (!repoPath) {
  console.error(
    "Usage: node analyze-backports.js <path-to-repo> [--report]\n" +
      "  <path-to-repo>  Path to a repo with a content/ directory containing .backportrc.json files\n" +
      "  --report        Generate a Markdown report file instead of console output"
  );
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────────

const CONTENT_DIR = join(repoPath, "content");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function c(color: keyof typeof COLORS, text: string): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function bar(count: number, max: number, width = 40): string {
  const filled = Math.round((count / max) * width);
  return c("cyan", "█".repeat(filled)) + c("dim", "░".repeat(width - filled));
}

function extractVersion(dirPath: string): string {
  return dirPath.split("/").pop()!;
}

function isNumberedVersion(v: string): boolean {
  return /^v\d/.test(v);
}

function parseVersion(v: string): { major: number; minor: number | null } | null {
  const match = v.match(/^v(\d+)(?:\.(\d+|x))?$/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: match[2] === "x" ? null : match[2] ? parseInt(match[2]) : null,
  };
}

function versionStyle(v: string): string {
  if (v === "upcoming" || v === "current") return v;
  if (/^v\d+\.x$/.test(v)) return "major (vN.x)";
  if (/^v\d+\.\d+$/.test(v)) return "minor (vN.N)";
  if (/^v\d+$/.test(v)) return "major (vN)";
  // Special cases like "manual"
  return "named";
}

// ── Load all configs ───────────────────────────────────────────────────

function loadConfigs(): ProjectAnalysis[] {
  const projects: ProjectAnalysis[] = [];

  for (const entry of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const configPath = join(CONTENT_DIR, entry.name, ".backportrc.json");
    if (!existsSync(configPath)) continue;

    const config: BackportConfig = JSON.parse(readFileSync(configPath, "utf-8"));
    const sourceVersions = config.sourceDirectoryChoices.map(extractVersion);
    const targetVersions = config.targetDirectoryChoices.map(extractVersion);
    const allVersions = [...new Set([...sourceVersions, ...targetVersions])];

    projects.push({
      name: entry.name,
      config,
      sourceVersions,
      targetVersions,
      allVersions,
      numberedVersions: allVersions.filter(isNumberedVersion),
      hasUpcoming: allVersions.includes("upcoming"),
      hasCurrent: allVersions.includes("current"),
      sourceOnlyVersions: sourceVersions.filter((v) => !targetVersions.includes(v)),
      targetOnlyVersions: targetVersions.filter((v) => !sourceVersions.includes(v)),
    });
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Analysis sections ──────────────────────────────────────────────────

function printHeader(text: string) {
  console.log();
  console.log(c("bold", `═══ ${text} ${"═".repeat(Math.max(0, 60 - text.length))}`));
  console.log();
}

function printVersionMap(projects: ProjectAnalysis[]) {
  printHeader("Backport Version Map by Project");

  const maxVersions = Math.max(...projects.map((p) => p.targetVersions.length));

  for (const p of projects) {
    const versions = p.targetVersions
      .map((v) => {
        if (v === "upcoming") return c("magenta", v);
        if (v === "current") return c("green", v);
        if (isNumberedVersion(v)) return c("yellow", v);
        return c("dim", v);
      })
      .join(c("dim", " → "));

    const countLabel = c("dim", `(${p.targetVersions.length})`);
    console.log(`  ${c("bold", p.name.padEnd(25))} ${countLabel.padEnd(20)} ${versions}`);
  }
}

function printVersionCountChart(projects: ProjectAnalysis[]) {
  printHeader("Target Version Count (Backport Breadth)");

  const sorted = [...projects].sort(
    (a, b) => b.targetVersions.length - a.targetVersions.length
  );
  const max = sorted[0].targetVersions.length;

  for (const p of sorted) {
    const count = p.targetVersions.length;
    console.log(
      `  ${p.name.padEnd(25)} ${bar(count, max)} ${c("bold", String(count))}`
    );
  }
}

function printSourceTargetAsymmetry(projects: ProjectAnalysis[]) {
  printHeader("Source/Target Asymmetry");
  console.log(
    c("dim", "  Projects where source and target directories differ — writers can")
  );
  console.log(
    c("dim", "  backport FROM some versions but not TO them, or vice versa.")
  );
  console.log();

  const asymmetric = projects.filter(
    (p) => p.sourceOnlyVersions.length > 0 || p.targetOnlyVersions.length > 0
  );

  if (asymmetric.length === 0) {
    console.log(c("green", "  All projects have symmetric source/target directories."));
    return;
  }

  for (const p of asymmetric) {
    console.log(`  ${c("bold", p.name)}`);
    if (p.sourceOnlyVersions.length > 0) {
      console.log(
        `    ${c("cyan", "Source-only")} (can backport FROM, not TO): ${p.sourceOnlyVersions.join(", ")}`
      );
    }
    if (p.targetOnlyVersions.length > 0) {
      console.log(
        `    ${c("yellow", "Target-only")} (can backport TO, not FROM): ${p.targetOnlyVersions.join(", ")}`
      );
    }
  }
}

function printVersioningPatterns(projects: ProjectAnalysis[]) {
  printHeader("Versioning Schemes");

  const schemeGroups: Record<string, string[]> = {};

  for (const p of projects) {
    const styles = new Set(p.numberedVersions.map(versionStyle));
    // If no numbered versions, categorize by what they do have
    const key =
      styles.size === 0
        ? p.allVersions.length <= 2
          ? "upcoming/current only"
          : "mixed"
        : [...styles].sort().join(" + ");

    (schemeGroups[key] ??= []).push(p.name);
  }

  for (const [scheme, names] of Object.entries(schemeGroups).sort(
    (a, b) => b[1].length - a[1].length
  )) {
    console.log(`  ${c("bold", scheme)} ${c("dim", `(${names.length} projects)`)}`);
    console.log(`    ${c("dim", names.join(", "))}`);
    console.log();
  }
}

function printOldestVersions(projects: ProjectAnalysis[]) {
  printHeader("Oldest Maintained Version per Project");

  const withVersions = projects
    .filter((p) => p.numberedVersions.length > 0)
    .map((p) => {
      const versions = p.numberedVersions
        .map((v) => ({ raw: v, parsed: parseVersion(v) }))
        .filter((v) => v.parsed !== null)
        .sort((a, b) => {
          const am = a.parsed!;
          const bm = b.parsed!;
          if (am.major !== bm.major) return am.major - bm.major;
          return (am.minor ?? 0) - (bm.minor ?? 0);
        });
      return { name: p.name, oldest: versions[0]?.raw, newest: versions.at(-1)?.raw };
    })
    .filter((p) => p.oldest);

  for (const p of withVersions) {
    console.log(
      `  ${p.name.padEnd(25)} ${c("yellow", (p.oldest ?? "").padEnd(10))} → ${c("green", p.newest ?? "")}`
    );
  }
}

function printConfigQuirks(projects: ProjectAnalysis[]) {
  printHeader("Configuration Differences");

  // Editor variations
  const editors: Record<string, string[]> = {};
  for (const p of projects) {
    (editors[p.config.editor] ??= []).push(p.name);
  }
  console.log(`  ${c("bold", "Editor settings:")}`);
  for (const [editor, names] of Object.entries(editors)) {
    console.log(`    ${c("cyan", `"${editor}"`).padEnd(30)} → ${names.length} projects`);
  }

  // Fork setting
  const noForkField = projects.filter((p) => p.config.fork === undefined);
  if (noForkField.length > 0) {
    console.log();
    console.log(`  ${c("bold", "Missing 'fork' field:")}`);
    console.log(`    ${c("yellow", noForkField.map((p) => p.name).join(", "))}`);
  }

  // maxNumber variations
  const maxNumbers = new Set(projects.map((p) => p.config.maxNumber));
  if (maxNumbers.size > 1) {
    console.log();
    console.log(`  ${c("bold", "Non-standard 'maxNumber' values:")}`);
    for (const p of projects) {
      if (p.config.maxNumber !== 15) {
        console.log(`    ${p.name}: ${c("yellow", String(p.config.maxNumber))}`);
      }
    }
  }
}

function printSummaryStats(projects: ProjectAnalysis[]) {
  printHeader("Summary");

  const totalVersionDirs = projects.reduce((sum, p) => sum + p.allVersions.length, 0);
  const totalNumberedVersions = projects.reduce(
    (sum, p) => sum + p.numberedVersions.length,
    0
  );
  const withUpcoming = projects.filter((p) => p.hasUpcoming).length;
  const withCurrent = projects.filter((p) => p.hasCurrent).length;
  const upcomingOnly = projects.filter(
    (p) => p.hasUpcoming && !p.hasCurrent && p.numberedVersions.length === 0
  );

  console.log(`  Total projects with backport configs:  ${c("bold", String(projects.length))}`);
  console.log(`  Total version directories tracked:     ${c("bold", String(totalVersionDirs))}`);
  console.log(`  Total numbered versions (vN.N / vN.x): ${c("bold", String(totalNumberedVersions))}`);
  console.log(`  Projects with 'upcoming':              ${c("bold", String(withUpcoming))}`);
  console.log(`  Projects with 'current':               ${c("bold", String(withCurrent))}`);
  console.log(
    `  Avg versions per project:              ${c("bold", (totalVersionDirs / projects.length).toFixed(1))}`
  );

  if (upcomingOnly.length > 0) {
    console.log();
    console.log(
      `  ${c("dim", "Projects with only upcoming/current (no archived versions):")}`
    );
    console.log(`    ${upcomingOnly.map((p) => p.name).join(", ")}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────

const projects = loadConfigs();

if (reportFlag) {
  const date = new Date().toISOString().split("T")[0];
  const outputPath = join("reports", "analyze-backports", `${date}_backport-analysis.md`);
  const markdown = generateMarkdownReport(projects, date);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, "utf-8");
  console.log(`\n✅ Markdown report written:\n   ${outputPath}\n`);
} else {
  console.log(c("bold", `\n  Backport Configuration Analysis — ${projects.length} projects\n`));

  printVersionMap(projects);
  printVersionCountChart(projects);
  printSourceTargetAsymmetry(projects);
  printVersioningPatterns(projects);
  printOldestVersions(projects);
  printConfigQuirks(projects);
  printSummaryStats(projects);

  console.log();
}
