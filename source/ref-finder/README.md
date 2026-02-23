# MongoDB Docs Ref Finder

Analyze reStructuredText ref declarations across the App Services and Atlas
Triggers documentation projects. Produces a CSV report that maps every ref in
App Services, indicates whether an equivalent `atlas-`-prefixed ref exists in
the Triggers docs, and lists any Triggers pages that invoke App Services refs.

## Purpose

The App Services documentation is being migrated into the Atlas docs set. Part
of that migration involves the Triggers content, which already has its own copy
under the Atlas project. During migration we need to understand:

1. Which refs exist in the App Services source.
2. Which of those refs already have an `atlas-` counterpart in the Triggers
   content (e.g. `.. _aws-eventbridge:` → `.. _atlas-aws-eventbridge:`).
3. Which Triggers pages reference App Services refs directly (via `:ref:`),
   since those cross-project references may need updating.

## Content directories

Both paths are relative to the `docs-mongodb-internal` repository root.

| Label              | Relative path                             | Description                        |
| ------------------ | ----------------------------------------- | ---------------------------------- |
| **App Services**   | `content/app-services/source/`            | Full App Services docs source tree |
| **Atlas Triggers** | `content/atlas/source/atlas-ui/triggers/` | Triggers subset of the Atlas docs  |

The script should accept a `--docs-repo` CLI argument (or fall back to a
sensible default) so the absolute path is not hard-coded.

## Processing pipeline

### Step 1 — Collect App Services ref declarations

Recursively find every `.txt` file under the App Services source directory.
For each file, extract all lines matching the ref declaration pattern:

```
.. _<REF-NAME>:
```

**Regex:** `^\.\. _([^:]+):$` (anchored to the start of the line).

Store each match as a record with:

- The full declaration string (e.g. `.. _aws-eventbridge:`)
- The extracted ref name (e.g. `aws-eventbridge`)
- The source file path (relative to the docs repo root)
- The docs project name: `app-services`

### Step 2 — Collect Atlas Triggers ref declarations

Recursively find every `.txt` file under the Atlas Triggers directory. Extract
ref declarations using the same pattern. All refs in this directory are
prefixed with `atlas-` (e.g. `.. _atlas-aws-eventbridge:`).

Build a **lookup set** of Atlas Triggers ref names (with the `atlas-` prefix
stripped) for fast comparison in the next step.

### Step 3 — Determine `exists-in-atlas`

For each App Services ref, check whether its ref name appears in the Atlas
Triggers lookup set. The matching rule is simple: an App Services ref
`<REF-NAME>` has an Atlas equivalent if `atlas-<REF-NAME>` was found in
Step 2.

### Step 4 — Find App Services ref invocations in Triggers content

Scan every `.txt` file under the Atlas Triggers directory for **ref
invocations** — inline references to App Services refs. The invocation
pattern is:

```
:ref:`<DISPLAY TEXT> <REF-NAME>`
```

or the shorter form:

```
:ref:`<REF-NAME>`
```

**Regex:** `:ref:\`(?:[^<\`]\*<)?([^>\`]+)>?\`` to capture the ref name.

Record each invocation with:

- The ref name being invoked
- The Triggers file where the invocation appears
- The line number

## Output

Write a CSV file to `source/ref-finder/output/refs.csv`.

### CSV columns

| Column                 | Type    | Description                                                                     | Example                                                      |
| ---------------------- | ------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `ref-name`             | string  | The extracted ref name (without `.. _` and trailing `:`)                        | `aws-eventbridge`                                            |
| `ref-string`           | string  | The full declaration string                                                     | `.. _aws-eventbridge:`                                       |
| `docs-project`         | string  | Always `app-services` for this report                                           | `app-services`                                               |
| `source-page`          | string  | Relative path to the `.txt` file containing the declaration                     | `content/app-services/source/triggers/database-triggers.txt` |
| `exists-in-atlas`      | boolean | `true` if `atlas-<ref-name>` exists in the Triggers docs                        | `true`                                                       |
| `triggers-invocations` | string  | Semicolon-delimited list of Triggers files that invoke this ref (empty if none) | `database-triggers.txt:56;limitations.txt:51`                |

### Duplicate refs

If more than one file declares the same ref name, each declaration gets its
own row. This makes duplicates visible for manual review — duplicate ref
declarations are usually errors in Sphinx projects.

## Module design

```
source/ref-finder/
├── index.ts              # CLI entry point (commander)
├── scanner.ts            # File discovery and ref extraction
├── matcher.ts            # exists-in-atlas matching + invocation search
├── csv-writer.ts         # CSV generation
├── types.ts              # Shared domain types
└── output/               # Generated output (git-ignored)
    └── refs.csv
```

### Key types

```typescript
/** A single ref declaration found in a .txt file. */
interface RefDeclaration {
  refName: string; // e.g. "aws-eventbridge"
  refString: string; // e.g. ".. _aws-eventbridge:"
  docsProject: string; // e.g. "app-services"
  sourcePage: string; // relative file path
}

/** A ref invocation (:ref:`...`) found in a Triggers file. */
interface RefInvocation {
  refName: string; // the ref being invoked
  sourcePage: string; // Triggers file where the invocation appears
  line: number; // 1-based line number
}

/** A fully resolved row for the output CSV. */
interface RefReportRow {
  refName: string;
  refString: string;
  docsProject: string;
  sourcePage: string;
  existsInAtlas: boolean;
  triggersInvocations: string; // semicolon-delimited "file:line" entries
}
```

## CLI interface

```bash
# Default — uses ../docs-mongodb-internal relative to the repo root
npm run ref-finder

# Explicit docs repo path
node dist/source/ref-finder/index.js --docs-repo /path/to/docs-mongodb-internal
```

| Option               | Description                                       | Default                         |
| -------------------- | ------------------------------------------------- | ------------------------------- |
| `--docs-repo <path>` | Absolute path to the `docs-mongodb-internal` repo | Auto-detected sibling directory |

## Edge cases

- **Files with no refs:** Skipped silently.
- **Non-`.txt` files:** Ignored in all directory scans.
- **Subdirectories:** Both App Services and Triggers directories are scanned
  recursively (includes child directories like `triggers/functions/`).
- **Ref names with special characters:** Captured as-is by the regex; no
  normalization applied.
- **Refs declared on non-first lines:** The regex matches any line in the file,
  not just line 1.
