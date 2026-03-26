# countTestedExamples

Counts files in `docs-mongodb-internal/content/code-examples/tested`, broken out by top-level directory (and subdirectory where applicable).

Supports two modes: a **snapshot** of the current working tree, or a **time range comparison** using git history — no checkout required.

## Usage

```bash
# Snapshot of current state
npm run count-tested-examples

# Compare the last 7 days
npm run count-tested-examples -- --last-7-days

# Compare two points in time
npm run count-tested-examples -- --start 2025-08-01 --end 2025-12-01

# Show examples in open PRs (pipeline)
npm run count-tested-examples -- --pipeline

# Override the directory to search for the repo (default: ~/Documents/GitHub)
npm run count-tested-examples -- /path/to/search --start 2025-08-01 --end 2025-12-01
```

## Output

**Snapshot mode:**

```
=== Code Example Files Report (current) ===

command-line/mongosh              343 files
csharp/driver                     113 files
go/atlas-sdk                       49 files
...
----------------------------------------
Total                             856 files
```

**Range mode:**

```
=== Code Example Files Report (2025-08-01 → 2025-12-01) ===

Directory                        Start     End   Change
--------------------------------------------------------
command-line/mongosh                 0      44      +44
csharp/driver                       36      68      +32
...
--------------------------------------------------------
Total                              144     397     +253

Start commit: a68fbf8bd3 (2025-08-01)
End commit:   4b439838b0 (2025-12-01)
```

**Pipeline mode:**

```
=== Code Examples in Pipeline (1 open PRs) ===

PR #18806 — DOCSP-58228: Migrate EF Core code examples to Grove pattern (@mongoKart)
  csharp/ef-core                  43 files
  Subtotal                        43 files

----------------------------------------
csharp/ef-core                    43 files
----------------------------------------
Total (all PRs)                   43 files
```

## Notes

- The script auto-discovers the `docs-mongodb-internal` repo by searching from the provided root directory (or `~/Documents/GitHub` by default).
- Range mode uses `git ls-tree` at the nearest commits before each date, so the repo must have full git history (not a shallow clone).
- If the `tested` directory didn't exist at the start date, the start count will be 0.
