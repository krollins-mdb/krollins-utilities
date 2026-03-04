export interface MetricFields {
  clones: number;
  viewCount: number;
  uniqueViews: number;
  stars: number;
  forks: number;
  watchers: number;
}

export interface CollectionMetrics extends MetricFields {
  collectionName: string;
}

export interface MonthlyMetrics extends MetricFields {
  month: string; // Format: "YYYY-MM"
  date: Date;
  // Delta values (new additions compared to previous month)
  newStars?: number;
  newForks?: number;
  newWatchers?: number;
}

export interface CollectionMonthlyMetrics {
  collectionName: string;
  monthlyData: MonthlyMetrics[];
}

export type ReportType = "grand-totals" | "monthly";
