/**
 * Matching logic for the Ref Finder tool.
 *
 * Determines whether each App Services ref has an `atlas-` counterpart
 * in the Triggers docs, and maps Triggers invocations back to App
 * Services ref declarations.
 */

import type { RefDeclaration, RefInvocation, RefReportRow } from "./types.js";

const ATLAS_PREFIX = "atlas-";

/**
 * Build a lookup set of ref names from Atlas Triggers declarations.
 *
 * Strips the `atlas-` prefix so the resulting set contains the
 * "bare" ref names for direct comparison with App Services refs.
 *
 * @param triggerDeclarations - Ref declarations from the Triggers directory
 * @returns Set of ref names with the `atlas-` prefix removed
 */
export function buildAtlasLookup(
  triggerDeclarations: RefDeclaration[],
): Set<string> {
  const lookup = new Set<string>();

  for (const decl of triggerDeclarations) {
    if (decl.refName.startsWith(ATLAS_PREFIX)) {
      lookup.add(decl.refName.slice(ATLAS_PREFIX.length));
    } else {
      // Include refs that don't have the prefix as-is, in case
      // the Triggers dir contains non-prefixed refs.
      lookup.add(decl.refName);
    }
  }

  return lookup;
}

/**
 * Group ref invocations by ref name for fast lookup.
 *
 * @param invocations - All ref invocations found in Triggers content
 * @returns Map from ref name to its invocation locations
 */
export function groupInvocationsByRef(
  invocations: RefInvocation[],
): Map<string, RefInvocation[]> {
  const grouped = new Map<string, RefInvocation[]>();

  for (const inv of invocations) {
    const existing = grouped.get(inv.refName);
    if (existing) {
      existing.push(inv);
    } else {
      grouped.set(inv.refName, [inv]);
    }
  }

  return grouped;
}

/**
 * Format invocation locations as a semicolon-delimited string.
 *
 * Each entry is formatted as `<filename>:<line>`, using only the
 * filename (not the full path) for readability.
 *
 * @param invocations - Invocations of a single ref
 * @returns Formatted string, e.g. "database-triggers.txt:56;limitations.txt:51"
 */
function formatInvocations(invocations: RefInvocation[]): string {
  return invocations
    .map((inv) => {
      // Use the last segment of the path for readability
      const filename = inv.sourcePage.split("/").pop() ?? inv.sourcePage;
      return `${filename}:${inv.line}`;
    })
    .join(";");
}

/**
 * Resolve App Services declarations into fully populated report rows.
 *
 * For each App Services ref declaration:
 * 1. Check if the ref name exists in the Atlas Triggers lookup set
 * 2. Find any Triggers invocations that reference it
 * 3. Combine into a RefReportRow
 *
 * @param appServicesRefs - All ref declarations from App Services content
 * @param atlasLookup - Set of bare ref names found in Triggers declarations
 * @param invocationsByRef - Triggers invocations grouped by ref name
 * @returns Array of fully resolved report rows
 */
export function resolveReportRows(
  appServicesRefs: RefDeclaration[],
  atlasLookup: Set<string>,
  invocationsByRef: Map<string, RefInvocation[]>,
): RefReportRow[] {
  return appServicesRefs.map((decl) => {
    const existsInAtlas = atlasLookup.has(decl.refName);
    const invocations = invocationsByRef.get(decl.refName) ?? [];

    return {
      refName: decl.refName,
      refString: decl.refString,
      docsProject: decl.docsProject,
      sourcePage: decl.sourcePage,
      existsInAtlas,
      triggersInvocations: formatInvocations(invocations),
    };
  });
}
