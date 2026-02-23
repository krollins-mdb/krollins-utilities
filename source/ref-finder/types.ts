/**
 * Shared domain types for the Ref Finder tool.
 *
 * These types model the three stages of the pipeline:
 * 1. RefDeclaration — raw ref declarations extracted from .txt files
 * 2. RefInvocation — :ref: usages found in Triggers content
 * 3. RefReportRow — fully resolved output rows for the CSV
 */

/** A single ref declaration (`.. _<name>:`) found in a .txt file. */
export interface RefDeclaration {
  /** The extracted ref name, e.g. "aws-eventbridge" */
  refName: string;
  /** The full declaration string, e.g. ".. _aws-eventbridge:" */
  refString: string;
  /** The docs project name, e.g. "app-services" */
  docsProject: string;
  /** File path relative to the docs repo root */
  sourcePage: string;
}

/** A ref invocation (`:ref:\`...\``) found in a Triggers .txt file. */
export interface RefInvocation {
  /** The ref name being invoked */
  refName: string;
  /** Triggers file path relative to the docs repo root */
  sourcePage: string;
  /** 1-based line number where the invocation appears */
  line: number;
}

/** A fully resolved row for the output CSV. */
export interface RefReportRow {
  refName: string;
  refString: string;
  docsProject: string;
  sourcePage: string;
  existsInAtlas: boolean;
  /** Semicolon-delimited "file:line" entries, empty string if none */
  triggersInvocations: string;
}
