import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from the .env file in the same directory as this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

interface MetricFields {
  clones: number;
  viewCount: number;
  uniqueViews: number;
  stars: number;
  forks: number;
  watchers: number;
}

interface CollectionMetrics extends MetricFields {
  collectionName: string;
}

const COLLECTIONS = [
  "mongodb_sample-app-java-mflix",
  "mongodb_sample-app-python-mflix",
  "mongodb_sample-app-nodejs-mflix",
];

const FIELDS_TO_SUM: (keyof MetricFields)[] = [
  "clones",
  "viewCount",
  "uniqueViews",
];

const FIELDS_TO_MAX: (keyof MetricFields)[] = ["stars", "forks", "watchers"];

async function aggregateCollectionMetrics(
  client: MongoClient,
  dbName: string,
  collectionName: string
): Promise<CollectionMetrics> {
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const documents = await collection.find({}).toArray();

  const metrics: MetricFields = {
    clones: 0,
    viewCount: 0,
    uniqueViews: 0,
    stars: 0,
    forks: 0,
    watchers: 0,
  };

  for (const doc of documents) {
    // Sum these fields
    for (const field of FIELDS_TO_SUM) {
      if (typeof doc[field] === "number") {
        metrics[field] += doc[field];
      }
    }
    // Find max for these fields
    for (const field of FIELDS_TO_MAX) {
      if (typeof doc[field] === "number") {
        metrics[field] = Math.max(metrics[field], doc[field]);
      }
    }
  }

  return {
    collectionName,
    ...metrics,
  };
}

function printCollectionReport(metrics: CollectionMetrics): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Collection: ${metrics.collectionName}`);
  console.log("=".repeat(60));
  console.log(`  Clones (total):        ${metrics.clones.toLocaleString()}`);
  console.log(`  View Count (total):    ${metrics.viewCount.toLocaleString()}`);
  console.log(
    `  Unique Views (total):  ${metrics.uniqueViews.toLocaleString()}`
  );
  console.log(`  Stars (max):           ${metrics.stars.toLocaleString()}`);
  console.log(`  Forks (max):           ${metrics.forks.toLocaleString()}`);
  console.log(`  Watchers (max):        ${metrics.watchers.toLocaleString()}`);
}

function printGrandTotalReport(allMetrics: CollectionMetrics[]): void {
  const grandTotals: MetricFields = {
    clones: 0,
    viewCount: 0,
    uniqueViews: 0,
    stars: 0,
    forks: 0,
    watchers: 0,
  };

  for (const metrics of allMetrics) {
    // Sum these fields across collections
    for (const field of FIELDS_TO_SUM) {
      grandTotals[field] += metrics[field];
    }
    // Sum max values from each collection for these fields
    for (const field of FIELDS_TO_MAX) {
      grandTotals[field] += metrics[field];
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`GRAND TOTALS (All Collections)`);
  console.log("=".repeat(60));
  console.log(
    `  Clones (total):        ${grandTotals.clones.toLocaleString()}`
  );
  console.log(
    `  View Count (total):    ${grandTotals.viewCount.toLocaleString()}`
  );
  console.log(
    `  Unique Views (total):  ${grandTotals.uniqueViews.toLocaleString()}`
  );
  console.log(`  Stars (max):           ${grandTotals.stars.toLocaleString()}`);
  console.log(`  Forks (max):           ${grandTotals.forks.toLocaleString()}`);
  console.log(
    `  Watchers (max):        ${grandTotals.watchers.toLocaleString()}`
  );
  console.log("=".repeat(60));
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    console.error("Error: MONGODB_URI and DB_NAME must be set in .env file");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("Connected successfully!");

    const allMetrics: CollectionMetrics[] = [];

    for (const collectionName of COLLECTIONS) {
      console.log(`\nProcessing collection: ${collectionName}...`);
      const metrics = await aggregateCollectionMetrics(
        client,
        dbName,
        collectionName
      );
      allMetrics.push(metrics);
      printCollectionReport(metrics);
    }

    printGrandTotalReport(allMetrics);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

main();
