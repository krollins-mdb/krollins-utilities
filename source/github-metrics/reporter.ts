import type {
  MetricFields,
  CollectionMetrics,
  MonthlyMetrics,
  CollectionMonthlyMetrics,
} from "./types.js";
import { FIELDS_TO_SUM, FIELDS_TO_MAX } from "./constants.js";

const TABLE_WIDTH = 120;

/**
 * Renders a titled monthly table with a header row, data rows, and a totals row.
 * Used by both per-collection and grand-total monthly reports.
 */
function printMonthlyTable(title: string, monthlyData: MonthlyMetrics[]): void {
  console.log(`\n${"=".repeat(TABLE_WIDTH)}`);
  console.log(title);
  console.log("=".repeat(TABLE_WIDTH));

  if (monthlyData.length === 0) {
    console.log(
      "  No monthly data available (documents may be missing date fields)",
    );
    return;
  }

  console.log(
    `\n${"Month".padEnd(12)} | ${"Clones".padStart(10)} | ${"Views".padStart(10)} | ${"Unique".padStart(10)} | ${"Stars".padStart(8)} | ${"Forks".padStart(8)} | ${"Watch".padStart(8)}`,
  );
  console.log("-".repeat(TABLE_WIDTH));

  for (const monthData of monthlyData) {
    console.log(
      `${monthData.month.padEnd(12)} | ${String(monthData.clones).padStart(10)} | ${String(monthData.viewCount).padStart(10)} | ${String(monthData.uniqueViews).padStart(10)} | ${String(monthData.newStars ?? 0).padStart(8)} | ${String(monthData.newForks ?? 0).padStart(8)} | ${String(monthData.newWatchers ?? 0).padStart(8)}`,
    );
  }

  // Totals row
  const totals: MetricFields = {
    clones: 0,
    viewCount: 0,
    uniqueViews: 0,
    stars: 0,
    forks: 0,
    watchers: 0,
  };
  let totalNewStars = 0;
  let totalNewForks = 0;
  let totalNewWatchers = 0;

  for (const monthData of monthlyData) {
    for (const field of FIELDS_TO_SUM) {
      totals[field] += monthData[field];
    }
    for (const field of FIELDS_TO_MAX) {
      totals[field] = Math.max(totals[field], monthData[field]);
    }
    totalNewStars += monthData.newStars ?? 0;
    totalNewForks += monthData.newForks ?? 0;
    totalNewWatchers += monthData.newWatchers ?? 0;
  }

  console.log("-".repeat(TABLE_WIDTH));
  console.log(
    `${"TOTAL".padEnd(12)} | ${String(totals.clones).padStart(10)} | ${String(totals.viewCount).padStart(10)} | ${String(totals.uniqueViews).padStart(10)} | ${String(totalNewStars).padStart(8)} | ${String(totalNewForks).padStart(8)} | ${String(totalNewWatchers).padStart(8)}`,
  );
}

export function printCollectionReport(metrics: CollectionMetrics): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Collection: ${metrics.collectionName}`);
  console.log("=".repeat(60));
  console.log(`  Clones (total):        ${metrics.clones.toLocaleString()}`);
  console.log(`  View Count (total):    ${metrics.viewCount.toLocaleString()}`);
  console.log(
    `  Unique Views (total):  ${metrics.uniqueViews.toLocaleString()}`,
  );
  console.log(`  Stars (max):           ${metrics.stars.toLocaleString()}`);
  console.log(`  Forks (max):           ${metrics.forks.toLocaleString()}`);
  console.log(`  Watchers (max):        ${metrics.watchers.toLocaleString()}`);
}

export function printGrandTotalReport(allMetrics: CollectionMetrics[]): void {
  const grandTotals: MetricFields = {
    clones: 0,
    viewCount: 0,
    uniqueViews: 0,
    stars: 0,
    forks: 0,
    watchers: 0,
  };

  for (const metrics of allMetrics) {
    for (const field of FIELDS_TO_SUM) {
      grandTotals[field] += metrics[field];
    }
    // Sum max values from each collection
    for (const field of FIELDS_TO_MAX) {
      grandTotals[field] += metrics[field];
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`GRAND TOTALS (All Collections)`);
  console.log("=".repeat(60));
  console.log(
    `  Clones (total):        ${grandTotals.clones.toLocaleString()}`,
  );
  console.log(
    `  View Count (total):    ${grandTotals.viewCount.toLocaleString()}`,
  );
  console.log(
    `  Unique Views (total):  ${grandTotals.uniqueViews.toLocaleString()}`,
  );
  console.log(`  Stars (max):           ${grandTotals.stars.toLocaleString()}`);
  console.log(`  Forks (max):           ${grandTotals.forks.toLocaleString()}`);
  console.log(
    `  Watchers (max):        ${grandTotals.watchers.toLocaleString()}`,
  );
  console.log("=".repeat(60));
}

export function printMonthlyReport(
  collectionMonthlyMetrics: CollectionMonthlyMetrics,
): void {
  printMonthlyTable(
    `Collection: ${collectionMonthlyMetrics.collectionName}`,
    collectionMonthlyMetrics.monthlyData,
  );
}

export function printGrandTotalMonthlyReport(
  combinedMetrics: MonthlyMetrics[],
): void {
  printMonthlyTable("GRAND TOTAL - All Collections Combined", combinedMetrics);
}
