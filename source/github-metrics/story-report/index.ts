/**
 * Entry point for the Sample App Engagement Storytelling Report.
 *
 * Usage:
 *   npm run github-stories
 *
 * Requires a .env file in source/github-metrics/ with:
 *   MONGODB_URI=<connection string>
 *   DB_NAME=<database name>
 */

import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { CollectionMonthlyMetrics } from "../types.js";
import { COLLECTIONS } from "../constants.js";
import {
  aggregateMonthlyMetrics,
  combineMonthlyMetrics,
} from "../aggregator.js";
import { writeStoryReport } from "./writer.js";

// Load environment variables from .env in the parent github-metrics directory.
// When compiled, this runs from dist/source/github-metrics/story-report/,
// so we resolve back to the source directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = __dirname.includes("/dist/")
  ? path.join(__dirname.replace("/dist/", "/"), "..", ".env")
  : path.join(__dirname, "..", ".env");
dotenv.config({ path: parentDir });

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    console.error(
      "Error: MONGODB_URI and DB_NAME must be set in .env file " +
        "(source/github-metrics/.env)",
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("Connected successfully!\n");

    console.log("📊 Gathering monthly metrics for storytelling report...\n");

    const allMonthlyMetrics: CollectionMonthlyMetrics[] = [];

    for (const collectionName of COLLECTIONS) {
      console.log(`  Fetching: ${collectionName}...`);
      const monthlyMetrics = await aggregateMonthlyMetrics(
        client,
        dbName,
        collectionName,
      );
      allMonthlyMetrics.push(monthlyMetrics);
    }

    const combined = combineMonthlyMetrics(allMonthlyMetrics);

    // Build output path
    const timestamp = new Date().toISOString().split("T")[0];
    const outputDir = `./reports/github-metrics-stories/${timestamp}_engagement-stories`;

    console.log("\n🎨 Generating engagement storytelling report...");
    const indexPath = await writeStoryReport(
      allMonthlyMetrics,
      combined,
      outputDir,
    );

    console.log(`\n✅ Report written successfully!`);
    console.log(`   ${indexPath}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

main();
