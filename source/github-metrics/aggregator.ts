import { MongoClient } from "mongodb";
import type {
  MetricFields,
  CollectionMetrics,
  MonthlyMetrics,
  CollectionMonthlyMetrics,
} from "./types.js";
import { FIELDS_TO_SUM, FIELDS_TO_MAX } from "./constants.js";

/**
 * Converts a month-keyed map of metric data into a sorted MonthlyMetrics array,
 * including delta (new additions) calculations for cumulative fields.
 */
function buildMonthlyMetricsFromMap(
  monthlyMap: Map<string, MetricFields & { date: Date }>,
): MonthlyMetrics[] {
  const sortedEntries = Array.from(monthlyMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return sortedEntries.map(([month, data], index) => {
    let newStars = data.stars;
    let newForks = data.forks;
    let newWatchers = data.watchers;

    if (index > 0) {
      const prevData = sortedEntries[index - 1][1];
      newStars = Math.max(0, data.stars - prevData.stars);
      newForks = Math.max(0, data.forks - prevData.forks);
      newWatchers = Math.max(0, data.watchers - prevData.watchers);
    }

    return {
      month,
      date: data.date,
      clones: data.clones,
      viewCount: data.viewCount,
      uniqueViews: data.uniqueViews,
      stars: data.stars,
      forks: data.forks,
      watchers: data.watchers,
      newStars,
      newForks,
      newWatchers,
    };
  });
}

export async function aggregateCollectionMetrics(
  client: MongoClient,
  dbName: string,
  collectionName: string,
): Promise<CollectionMetrics> {
  const collection = client.db(dbName).collection(collectionName);
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
    for (const field of FIELDS_TO_SUM) {
      if (typeof doc[field] === "number") {
        metrics[field] += doc[field];
      }
    }
    for (const field of FIELDS_TO_MAX) {
      if (typeof doc[field] === "number") {
        metrics[field] = Math.max(metrics[field], doc[field]);
      }
    }
  }

  return { collectionName, ...metrics };
}

export async function aggregateMonthlyMetrics(
  client: MongoClient,
  dbName: string,
  collectionName: string,
): Promise<CollectionMonthlyMetrics> {
  const collection = client.db(dbName).collection(collectionName);
  const documents = await collection.find({}).toArray();

  const monthlyMap = new Map<string, MetricFields & { date: Date }>();

  for (const doc of documents) {
    let docDate: Date | null = null;

    if (doc.date instanceof Date) {
      docDate = doc.date;
    } else if (typeof doc.date === "string") {
      docDate = new Date(doc.date);
    } else if (doc.timestamp instanceof Date) {
      docDate = doc.timestamp;
    } else if (typeof doc.timestamp === "string") {
      docDate = new Date(doc.timestamp);
    } else if (doc.createdAt instanceof Date) {
      docDate = doc.createdAt;
    } else if (typeof doc.createdAt === "string") {
      docDate = new Date(doc.createdAt);
    } else if (doc._id && typeof doc._id.getTimestamp === "function") {
      docDate = doc._id.getTimestamp();
    }

    if (!docDate || isNaN(docDate.getTime())) {
      continue;
    }

    const monthKey = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        clones: 0,
        viewCount: 0,
        uniqueViews: 0,
        stars: 0,
        forks: 0,
        watchers: 0,
        date: new Date(docDate.getFullYear(), docDate.getMonth(), 1),
      });
    }

    const monthMetrics = monthlyMap.get(monthKey)!;

    for (const field of FIELDS_TO_SUM) {
      if (typeof doc[field] === "number") {
        monthMetrics[field] += doc[field];
      }
    }
    for (const field of FIELDS_TO_MAX) {
      if (typeof doc[field] === "number") {
        monthMetrics[field] = Math.max(monthMetrics[field], doc[field]);
      }
    }
  }

  return {
    collectionName,
    monthlyData: buildMonthlyMetricsFromMap(monthlyMap),
  };
}

/**
 * Merges monthly metrics from multiple collections into a single combined timeline.
 */
export function combineMonthlyMetrics(
  allCollectionMetrics: CollectionMonthlyMetrics[],
): MonthlyMetrics[] {
  const monthlyMap = new Map<string, MetricFields & { date: Date }>();

  for (const collectionMetrics of allCollectionMetrics) {
    for (const monthData of collectionMetrics.monthlyData) {
      if (!monthlyMap.has(monthData.month)) {
        monthlyMap.set(monthData.month, {
          clones: 0,
          viewCount: 0,
          uniqueViews: 0,
          stars: 0,
          forks: 0,
          watchers: 0,
          date: monthData.date,
        });
      }

      const combined = monthlyMap.get(monthData.month)!;

      for (const field of FIELDS_TO_SUM) {
        combined[field] += monthData[field];
      }
      for (const field of FIELDS_TO_MAX) {
        combined[field] += monthData[field];
      }
    }
  }

  return buildMonthlyMetricsFromMap(monthlyMap);
}
