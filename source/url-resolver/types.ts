export interface FileMapping {
  sourcePath: string;
  productionUrl: string;
  isValid?: boolean;
}

export interface ResolverConfig {
  sourceDir: string;
  baseUrl: string;
  outputCsvPath: string;
}
