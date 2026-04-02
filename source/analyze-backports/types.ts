export interface BackportConfig {
  repoOwner: string;
  repoName: string;
  sourceBranch: string;
  sourceDirectoryChoices: string[];
  targetBranchChoices: string[];
  targetDirectoryChoices: string[];
  backportTargetMode: string;
  editor: string;
  maxNumber: number;
  backportBranchName: string;
  prTitle: string;
  fork?: boolean;
}

export interface ProjectAnalysis {
  name: string;
  config: BackportConfig;
  sourceVersions: string[];
  targetVersions: string[];
  allVersions: string[];
  numberedVersions: string[];
  hasUpcoming: boolean;
  hasCurrent: boolean;
  sourceOnlyVersions: string[];
  targetOnlyVersions: string[];
}
