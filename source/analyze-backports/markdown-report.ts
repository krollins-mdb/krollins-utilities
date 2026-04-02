import { ProjectAnalysis } from "./types.js";

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
  return "named";
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function tableSeparator(count: number): string {
  return `| ${Array(count).fill("---").join(" | ")} |`;
}

// ── Report sections ───────────────────────────────────────────────────

function summarySection(projects: ProjectAnalysis[]): string {
  const totalVersionDirs = projects.reduce((sum, p) => sum + p.allVersions.length, 0);
  const totalNumbered = projects.reduce((sum, p) => sum + p.numberedVersions.length, 0);
  const withUpcoming = projects.filter((p) => p.hasUpcoming).length;
  const withCurrent = projects.filter((p) => p.hasCurrent).length;

  const lines = [
    "## At a Glance",
    "",
    tableRow(["Metric", "Count"]),
    tableSeparator(2),
    tableRow(["Projects with backport configs", String(projects.length)]),
    tableRow(["Total version directories tracked", String(totalVersionDirs)]),
    tableRow(["Numbered versions (vN.N / vN.x)", String(totalNumbered)]),
    tableRow(["Projects using \"upcoming\"", String(withUpcoming)]),
    tableRow(["Projects using \"current\"", String(withCurrent)]),
    tableRow(["Average versions per project", (totalVersionDirs / projects.length).toFixed(1)]),
  ];

  const upcomingOnly = projects.filter(
    (p) => p.hasUpcoming && !p.hasCurrent && p.numberedVersions.length === 0
  );
  if (upcomingOnly.length > 0) {
    lines.push(
      "",
      `> **Note:** ${upcomingOnly.length} project(s) use only upcoming/current with no archived versions: ${upcomingOnly.map((p) => p.name).join(", ")}`
    );
  }

  return lines.join("\n");
}

function versionMapSection(projects: ProjectAnalysis[]): string {
  const sorted = [...projects].sort(
    (a, b) => b.targetVersions.length - a.targetVersions.length
  );

  const lines = [
    "## Backport Targets by Project",
    "",
    "Each project can backport content to the versions listed below,",
    "ordered from newest to oldest. The **breadth** column shows how many",
    "target versions each project maintains.",
    "",
    tableRow(["Project", "Breadth", "Target versions"]),
    tableSeparator(3),
  ];

  for (const p of sorted) {
    const versions = p.targetVersions.join(" → ");
    lines.push(tableRow([p.name, String(p.targetVersions.length), versions]));
  }

  return lines.join("\n");
}

function asymmetrySection(projects: ProjectAnalysis[]): string {
  const asymmetric = projects.filter(
    (p) => p.sourceOnlyVersions.length > 0 || p.targetOnlyVersions.length > 0
  );

  const lines = [
    "## Source / Target Asymmetry",
    "",
    "Most projects allow backporting both *from* and *to* the same set of",
    "versions. The projects below are exceptions — they have versions that",
    "appear only as a source (you can copy from it) or only as a target",
    "(you can paste into it), but not both.",
    "",
  ];

  if (asymmetric.length === 0) {
    lines.push("All projects have symmetric source and target directories — no exceptions.");
    return lines.join("\n");
  }

  for (const p of asymmetric) {
    lines.push(`### ${p.name}`, "");
    if (p.sourceOnlyVersions.length > 0) {
      lines.push(
        `- **Source-only** (can backport *from*, not *to*): ${p.sourceOnlyVersions.join(", ")}`
      );
    }
    if (p.targetOnlyVersions.length > 0) {
      lines.push(
        `- **Target-only** (can backport *to*, not *from*): ${p.targetOnlyVersions.join(", ")}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function versioningSection(projects: ProjectAnalysis[]): string {
  const schemeGroups: Record<string, string[]> = {};

  for (const p of projects) {
    const styles = new Set(p.numberedVersions.map(versionStyle));
    const key =
      styles.size === 0
        ? p.allVersions.length <= 2
          ? "upcoming/current only"
          : "mixed"
        : [...styles].sort().join(" + ");
    (schemeGroups[key] ??= []).push(p.name);
  }

  const lines = [
    "## Versioning Schemes",
    "",
    "Projects use different styles for their version directories.",
    "This table groups projects by the versioning pattern they follow.",
    "",
    tableRow(["Scheme", "Count", "Projects"]),
    tableSeparator(3),
  ];

  for (const [scheme, names] of Object.entries(schemeGroups).sort(
    (a, b) => b[1].length - a[1].length
  )) {
    lines.push(tableRow([scheme, String(names.length), names.join(", ")]));
  }

  return lines.join("\n");
}

function versionRangesSection(projects: ProjectAnalysis[]): string {
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

  const lines = [
    "## Version Ranges",
    "",
    "For projects with numbered versions, this shows the oldest and newest",
    "version currently maintained.",
    "",
    tableRow(["Project", "Oldest", "Newest"]),
    tableSeparator(3),
  ];

  for (const p of withVersions) {
    lines.push(tableRow([p.name, p.oldest ?? "", p.newest ?? ""]));
  }

  return lines.join("\n");
}

function configSection(projects: ProjectAnalysis[]): string {
  const lines = [
    "## Configuration Notes",
    "",
  ];

  // Editor variations
  const editors: Record<string, string[]> = {};
  for (const p of projects) {
    (editors[p.config.editor] ??= []).push(p.name);
  }

  lines.push(
    "### Editor settings",
    "",
    tableRow(["Editor value", "Projects"]),
    tableSeparator(2),
  );
  for (const [editor, names] of Object.entries(editors)) {
    lines.push(tableRow([`\`${editor}\``, String(names.length)]));
  }

  // Fork setting
  const noForkField = projects.filter((p) => p.config.fork === undefined);
  if (noForkField.length > 0) {
    lines.push(
      "",
      "### Missing `fork` field",
      "",
      `${noForkField.length} project(s) do not set the \`fork\` field in their config:`,
      "",
      ...noForkField.map((p) => `- ${p.name}`),
    );
  }

  // maxNumber variations
  const maxNumbers = new Set(projects.map((p) => p.config.maxNumber));
  if (maxNumbers.size > 1) {
    const nonDefault = projects.filter((p) => p.config.maxNumber !== 15);
    lines.push(
      "",
      "### Non-standard `maxNumber` values",
      "",
      "Most projects use `maxNumber: 15`. These differ:",
      "",
      tableRow(["Project", "maxNumber"]),
      tableSeparator(2),
      ...nonDefault.map((p) => tableRow([p.name, String(p.config.maxNumber)])),
    );
  }

  return lines.join("\n");
}

// ── Public API ────────────────────────────────────────────────────────

export function generateMarkdownReport(projects: ProjectAnalysis[], date: string): string {
  const sections = [
    `# Backport Configuration Analysis`,
    "",
    `*Generated ${date} — ${projects.length} projects analyzed*`,
    "",
    summarySection(projects),
    "",
    versionMapSection(projects),
    "",
    asymmetrySection(projects),
    "",
    versioningSection(projects),
    "",
    versionRangesSection(projects),
    "",
    configSection(projects),
    "",
  ];

  return sections.join("\n");
}
