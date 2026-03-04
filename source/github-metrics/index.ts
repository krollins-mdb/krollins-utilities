import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type {
  CollectionMetrics,
  CollectionMonthlyMetrics,
  ReportType,
} from "./types.js";
import { COLLECTIONS } from "./constants.js";
import {
  aggregateCollectionMetrics,
  aggregateMonthlyMetrics,
  combineMonthlyMetrics,
} from "./aggregator.js";
import {
  printCollectionReport,
  printGrandTotalReport,
  printMonthlyReport,
  printGrandTotalMonthlyReport,
} from "./reporter.js";
import { writeHTMLReport } from "./html-writer.js";

// Load environment variables from the .env file in the source directory
// When compiled, this runs from dist/source/github-metrics/, so we need to go back to source
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = __dirname.includes("/dist/")
  ? path.join(__dirname.replace("/dist/", "/"), ".env")
  : path.join(__dirname, ".env");
dotenv.config({ path: envPath });

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    console.error("Error: MONGODB_URI and DB_NAME must be set in .env file");
    process.exit(1);
  }

  // Parse command-line arguments
  const args = process.argv.slice(2);
  const reportType: ReportType = args.includes("--monthly")
    ? "monthly"
    : "grand-totals";

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("Connected successfully!");

    if (reportType === "grand-totals") {
      console.log("\n📊 Generating Grand Totals Report (All-Time)...\n");
      const allMetrics: CollectionMetrics[] = [];

      for (const collectionName of COLLECTIONS) {
        console.log(`Fetching collection: ${collectionName}...`);
        const metrics = await aggregateCollectionMetrics(
          client,
          dbName,
          collectionName,
        );
        allMetrics.push(metrics);
      }

      // Print individual collection reports
      for (const metrics of allMetrics) {
        printCollectionReport(metrics);
      }

      // Print grand totals
      printGrandTotalReport(allMetrics);
    } else {
      console.log("\n📈 Generating Monthly Metrics Report...\n");
      const allMonthlyMetrics: CollectionMonthlyMetrics[] = [];

      for (const collectionName of COLLECTIONS) {
        console.log(`Fetching collection: ${collectionName}...`);
        const monthlyMetrics = await aggregateMonthlyMetrics(
          client,
          dbName,
          collectionName,
        );
        allMonthlyMetrics.push(monthlyMetrics);
        printMonthlyReport(monthlyMetrics);
      }

      // Combine all collections and print grand total monthly report
      const combinedMonthlyMetrics = combineMonthlyMetrics(allMonthlyMetrics);
      printGrandTotalMonthlyReport(combinedMonthlyMetrics);

      // Write HTML report
      console.log("\n🎨 Generating HTML report...");
      const timestamp = new Date().toISOString().split("T")[0];
      const htmlPath = `./reports/github-metrics/${timestamp}_github-metrics.html`;
      await writeHTMLReport(
        allMonthlyMetrics,
        combinedMonthlyMetrics,
        htmlPath,
      );
      console.log(`\n✅ HTML report written:\n   - ${htmlPath}`);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }

  // Print usage info
  if (reportType === "grand-totals") {
    console.log("\n💡 Tip: Run with --monthly flag to see monthly metrics");
  } else {
    console.log("\n💡 Tip: Run without --monthly flag to see grand totals");
  }
}

main();
