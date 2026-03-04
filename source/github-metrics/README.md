# GitHub Metrics Reporter

A Node.js and TypeScript project that uses the MongoDB Node.js Driver to interact with an Atlas cluster and generate GitHub metrics reports.

## Overview

This tool aggregates data across 3 collections in the `github_metrics` database:

- mongodb_sample-app-java-mflix
- mongodb_sample-app-python-mflix
- mongodb_sample-app-nodejs-mflix

## Report Types

The tool supports two different report types:

### 1. Grand Totals Report (Default)

Generates an all-time summary with grand totals across all collections.

**Usage:**

```bash
npm run github-metrics
```

**Output:**

- Individual collection summaries with total clones, views, unique views, and max stars/forks/watchers
- Grand totals aggregating all collections

### 2. Monthly Metrics Report

Generates a month-by-month breakdown of metrics for each collection.

**Usage:**

```bash
npm run github-metrics -- --monthly
```

**Output:**

- Monthly data table for each collection showing:
  - Clones per month (summed)
  - View count per month (summed)
  - Unique views per month (summed)
  - New stars added that month
  - New forks added that month
  - New watchers added that month
- Collection totals
- **Grand Total Monthly Report**: Combined metrics across all collections by month

## Data Requirements

For monthly reports, documents must contain a date field. The tool checks for the following fields in order:

1. `date` (Date or string)
2. `timestamp` (Date or string)
3. `createdAt` (Date or string)
4. MongoDB ObjectId timestamp (from `_id` field)

Documents without valid date fields will be skipped in monthly reports.

## Metrics Aggregation

### Grand Totals Report

- **Summed fields**: clones, viewCount, uniqueViews
- **Max fields**: stars, forks, watchers (highest value across all documents)

### Monthly Metrics Report

- **Summed fields**: clones, viewCount, uniqueViews (aggregated per month)
- **Delta calculations**: For stars, forks, and watchers, the report shows:
  - The number of new additions compared to the previous month
  - For the first month, all values are considered "new"
  - Calculated by comparing the max value in the current month to the max value in the previous month

### Grand Total Monthly Report

When running with `--monthly`, after displaying individual collection reports, a combined grand total report is shown that:

- Aggregates all three collections' metrics by month
- Sums clones, views, and unique views across all collections
- Sums the max stars/forks/watchers from each collection
- Calculates month-over-month deltas for the combined totals
- Provides a comprehensive view of all repositories' performance over time
