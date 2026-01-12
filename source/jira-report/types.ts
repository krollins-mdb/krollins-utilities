/**
 * TypeScript interfaces for Jira report generation
 */

/**
 * Represents a single Jira issue with all CSV fields and derived data
 */
export interface JiraIssue {
  // CSV fields
  issueType: string;
  priority: string;
  summary: string;
  labels: string[];
  assignee: string;
  storyPointsEstimate?: number;
  storyPoints?: number;
  resolved: Date;
  created: Date;

  // Derived fields
  cycleTimeDays: number;
  estimationError?: number;
  priorityLevel: number; // 2, 3, 4, 5
  complexity: "high" | "medium" | "low";
  isProactive: boolean;
  isReactive: boolean;
  projectLabels: string[];
}

/**
 * Configuration options for the report generator
 */
export interface ReportOptions {
  inputPath: string;
  outputPath?: string;
  year?: number;
  assignee?: string;
  project?: string;
  title?: string;
}

/**
 * Project impact metrics
 */
export interface ProjectImpactMetrics {
  projectName: string;
  totalStoryPoints: number;
  issueCount: number;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  avgPointsPerIssue: number;
}

/**
 * Complexity analysis metrics
 */
export interface ComplexityMetrics {
  highComplexityItems: JiraIssue[];
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
  percentages: {
    high: number;
    medium: number;
    low: number;
  };
  topTenBiggestWins: Array<{
    summary: string;
    assignee: string;
    storyPoints: number;
    cycleTimeDays: number;
  }>;
}

/**
 * Proactive work metrics
 */
export interface ProactiveMetrics {
  proactiveCount: number;
  reactiveCount: number;
  proactivePoints: number;
  reactivePoints: number;
  proactivePercentage: number;
  byPerson: Record<
    string,
    {
      proactivePoints: number;
      reactivePoints: number;
    }
  >;
  monthlyTrend: Array<{
    month: string;
    proactivePoints: number;
    reactivePoints: number;
  }>;
}

/**
 * Team versatility metrics
 */
export interface VersatilityMetrics {
  byPerson: Record<
    string,
    {
      uniqueLabels: string[];
      projectCount: number;
      issueTypes: string[];
    }
  >;
  crossFunctionalContributors: string[];
}

/**
 * Cycle time analysis metrics
 */
export interface CycleTimeMetrics {
  overall: StatisticalSummary;
  byPriority: Record<string, StatisticalSummary>;
  outliers: Array<{
    issue: JiraIssue;
    standardDeviations: number;
  }>;
  quarterlyTrend: Array<{
    quarter: string;
    avgCycleTime: number;
  }>;
}

/**
 * Statistical summary for numeric data
 */
export interface StatisticalSummary {
  mean: number;
  median: number;
  p50: number;
  p75: number;
  p95: number;
  min: number;
  max: number;
  stdDev: number;
}

/**
 * Learning curve metrics
 */
export interface LearningMetrics {
  pattern: string;
  occurrences: Array<{
    issue: JiraIssue;
    cycleTime: number;
    order: number;
  }>;
  averageCycleTime: number;
  firstCycleTime: number;
  lastCycleTime: number;
  improvementPercentage: number;
}

/**
 * Unplanned work metrics
 */
export interface UnplannedWorkMetrics {
  reactiveCount: number;
  plannedCount: number;
  reactivePoints: number;
  plannedPoints: number;
  reactivePercentage: number;
  monthlyTrend: Array<{
    month: string;
    reactivePoints: number;
    plannedPoints: number;
  }>;
  byPerson: Record<
    string,
    {
      reactivePoints: number;
      plannedPoints: number;
    }
  >;
}

/**
 * Work-in-progress pattern metrics
 */
export interface WIPMetrics {
  byMonth: Array<{
    month: string;
    avgCycleTime: number;
    longRunningCount: number;
    concurrentProjects: number;
  }>;
  bottleneckMonths: string[];
  seasonalInsights: string[];
}

/**
 * Estimation accuracy metrics
 */
export interface EstimationMetrics {
  accuracyPercentage: number;
  overEstimationRatio: number;
  underEstimationRatio: number;
  byPerson: Record<
    string,
    {
      accuracyPercentage: number;
      avgError: number;
    }
  >;
  byWorkType: Record<
    string,
    {
      avgError: number;
      variance: number;
    }
  >;
}

/**
 * Priority alignment metrics
 */
export interface PriorityMetrics {
  distribution: Record<
    string,
    {
      count: number;
      storyPoints: number;
      percentage: number;
    }
  >;
  avgCycleTimeByPriority: Record<string, number>;
  recommendations: string[];
}

/**
 * Team load balance metrics
 */
export interface BalanceMetrics {
  byPerson: Record<
    string,
    {
      totalPoints: number;
      issueCount: number;
      avgPointsPerIssue: number;
    }
  >;
  avgPointsPerPerson: number;
  loadImbalances: Array<{
    person: string;
    variance: number;
  }>;
}

/**
 * Year-over-year comparison metrics
 */
export interface YearComparisonMetrics {
  currentYear: number;
  previousYear: number;
  comparison: {
    issues: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
    storyPoints: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
    avgCycleTime: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
    highComplexityItems: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
    proactivePercentage: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
    estimationAccuracy: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
  };
  insights: {
    improvements: string[];
    regressions: string[];
  };
}

/**
 * Complete analysis result structure
 */
export interface AnalysisResult {
  summary: {
    totalIssues: number;
    totalStoryPoints: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    uniqueAssignees: string[];
  };
  celebratingWork: {
    projectImpact: ProjectImpactMetrics[];
    complexityConquered: ComplexityMetrics;
    proactiveScore: ProactiveMetrics;
    teamVersatility: VersatilityMetrics;
  };
  areasForImprovement: {
    cycleTime: CycleTimeMetrics;
    learningCurve: LearningMetrics[];
    unplannedWork: UnplannedWorkMetrics;
    workInProgress: WIPMetrics;
    estimationAccuracy: EstimationMetrics;
    priorityAlignment: PriorityMetrics;
    teamBalance: BalanceMetrics;
  };
  yearComparison?: YearComparisonMetrics;
  yearData?: {
    years: number[];
    currentYear: number;
    previousYear: number;
    currentYearData: AnalysisResult;
    previousYearData: AnalysisResult;
  };
}

/**
 * Chart data structure for Chart.js
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}
