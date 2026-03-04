import type { MetricFields } from "./types.js";

export const COLLECTIONS = [
  "mongodb_sample-app-java-mflix",
  "mongodb_sample-app-python-mflix",
  "mongodb_sample-app-nodejs-mflix",
];

export const FIELDS_TO_SUM: (keyof MetricFields)[] = [
  "clones",
  "viewCount",
  "uniqueViews",
];

export const FIELDS_TO_MAX: (keyof MetricFields)[] = [
  "stars",
  "forks",
  "watchers",
];
