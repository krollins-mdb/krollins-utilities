import { MongoClient } from "mongodb";
import type {
  MetricFields,
  CollectionMetrics,
  MonthlyMetrics,
  CollectionMonthlyMetrics,
  ReferralSource,
  TopPath,
} from "./types.js";
import { FIELDS_TO_SUM, FIELDS_TO_MAX } from "./constants.js";

/** Internal per-month accumulator that includes referral/path maps. */
interface MonthBucket extends MetricFields {
  date: Date;
  referralMap: Map<string, { count: number; uniques: number }>;
  pathMap: Map<string, { count: number; uniques: number }>;
}

/**
 * Merge an array of ReferralSource / TopPath entries into a running map,
 * summing counts and taking the max of uniques (GitHub reports uniques
 * per-period, so max is more accurate than sum for overlapping windows).
 */
function mergeIntoMap(
  map: Map<string, { count: number; uniques: number }>,
  entries: {
    referrer?: string;
    path?: string;
    count: number;
    uniques: number;
  }[],
): void {
  for (const entry of entries) {
    const key = entry.referrer ?? entry.path ?? "";
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += entry.count;
      existing.uniques = Math.max(existing.uniques, entry.uniques);
    } else {
      map.set(key, { count: entry.count, uniques: entry.uniques });
    }
  }
}

/** Convert a map back to a sorted array (descending by count). */
function mapToSortedArray<T extends { count: number }>(
  map: Map<string, { count: number; uniques: number }>,
  keyName: "referrer" | "path",
): T[] {
  return Array.from(map.entries())
    .map(([key, val]) => ({ [keyName]: key, ...val }) as unknown as T)
    .sort((a, b) => b.count - a.count);
}

/**
 * Converts a month-keyed map of metric data into a sorted MonthlyMetrics array,
 * including delta (new additions) calculations for cumulative fields.
 */
function buildMonthlyMetricsFromMap(
  monthlyMap: Map<string, MonthBucket>,
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
      referralSources: mapToSortedArray<ReferralSource>(
        data.referralMap,
        "referrer",
      ),
      topPaths: mapToSortedArray<TopPath>(data.pathMap, "path"),
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

  const monthlyMap = new Map<string, MonthBucket>();

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
        referralMap: new Map(),
        pathMap: new Map(),
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

    // Aggregate referral sources and top paths
    if (Array.isArray(doc.referralSources) && doc.referralSources.length > 0) {
      mergeIntoMap(monthMetrics.referralMap, doc.referralSources);
    }
    if (Array.isArray(doc.topPaths) && doc.topPaths.length > 0) {
      mergeIntoMap(monthMetrics.pathMap, doc.topPaths);
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
  const monthlyMap = new Map<string, MonthBucket>();

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
          referralMap: new Map(),
          pathMap: new Map(),
        });
      }

      const combined = monthlyMap.get(monthData.month)!;

      for (const field of FIELDS_TO_SUM) {
        combined[field] += monthData[field];
      }
      for (const field of FIELDS_TO_MAX) {
        combined[field] += monthData[field];
      }

      // Merge referral sources and top paths
      if (monthData.referralSources.length > 0) {
        mergeIntoMap(combined.referralMap, monthData.referralSources);
      }
      if (monthData.topPaths.length > 0) {
        mergeIntoMap(combined.pathMap, monthData.topPaths);
      }
    }
  }

  return buildMonthlyMetricsFromMap(monthlyMap);
}
