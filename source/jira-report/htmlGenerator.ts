/**
 * HTML Generator
 * Generates complete HTML report from analysis results
 */

import { writeFile, mkdir } from "fs/promises";
import { dirname, basename, join, resolve } from "path";
import type { AnalysisResult } from "./types.js";
import { generateReportHTML, getStyles } from "./templates/reportTemplate.js";
import * as formatters from "./chartFormatters.js";
import {
  generateProjectTableScript,
  generateVersatilityScript,
  generateCycleTimeOutliersScript,
  generatePriorityRecommendationsScript,
  generateLoadBalanceScript,
  generateSeasonalInsightsScript,
  generateLearningCurvesScript,
} from "./templates/contentTemplates.js";

/**
 * Generate and save HTML report
 *
 * Creates a self-contained HTML file with:
 * - Embedded analysis data as JSON
 * - Chart.js visualizations (loaded from CDN)
 * - Interactive charts with hover tooltips
 * - Responsive design for mobile/desktop
 * - Print-friendly styles
 *
 * @param analysisResult - Complete analysis results from analyzeIssues()
 * @param outputPath - Path where HTML file should be written
 * @param title - Report title displayed in HTML (default: "Team Retrospective")
 * @throws Error if file write fails or path is invalid
 *
 * @example
 * ```typescript
 * const result = analyzeIssues(issues);
 * await generateHTMLReport(result, "./report.html", "2024 Retrospective");
 * ```
 */
export async function generateHTMLReport(
  analysisResult: AnalysisResult,
  outputPath: string,
  title: string = "Team Retrospective"
): Promise<void> {
  console.log("🎨 Generating HTML report...\n");

  // Sanitize output path to prevent path traversal attacks
  const sanitizedName = basename(outputPath).replace(/[^a-zA-Z0-9-_\.]/g, "-");
  const reportDir = sanitizedName.replace(/\.html$/, "");

  // Ensure output is within the current working directory
  const safePath = resolve(process.cwd(), reportDir);
  if (!safePath.startsWith(resolve(process.cwd()))) {
    throw new Error(
      "Security Error: Output path must be within the current directory"
    );
  }

  const assetsDir = join(safePath, "assets");

  await mkdir(safePath, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  // Serialize analysis data to JSON
  const analysisDataJson = JSON.stringify(analysisResult, null, 2);

  // Generate chart initialization code
  const chartInitCode = generateChartInitCode(analysisResult);

  // Generate helper content code
  const helperContentCode = generateHelperContent(analysisResult);

  // Generate separate files
  const cssContent = getStyles();
  const jsContent = generateJavaScript(
    analysisDataJson,
    chartInitCode,
    helperContentCode
  );

  // Write CSS file
  await writeFile(join(assetsDir, "report.css"), cssContent, "utf-8");

  // Write JavaScript file
  await writeFile(join(assetsDir, "report.js"), jsContent, "utf-8");

  // Generate HTML
  const html = generateReportHTML({
    title,
    generatedDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    analysisDataJson,
    chartInitCode,
    helperContentCode,
  });

  // Write HTML file
  await writeFile(join(safePath, "index.html"), html, "utf-8");

  console.log(`✅ HTML report generated: ${reportDir}/\n`);
  console.log(`   📄 index.html`);
  console.log(`   📁 assets/`);
  console.log(`      - report.css`);
  console.log(`      - report.js\n`);
}

/**
 * Generate JavaScript code to initialize all charts
 */
function generateChartInitCode(result: AnalysisResult): string {
  const charts: string[] = [];

  // Project Impact Chart
  charts.push(
    generateChartCode(
      "projectImpactChart",
      "bar",
      "formatters.formatProjectImpactChart(data)",
      "getBarChartConfig()"
    )
  );

  // Complexity Distribution Chart
  charts.push(
    generateChartCode(
      "complexityDistributionChart",
      "doughnut",
      "formatters.formatComplexityDistributionChart(data)",
      "getDoughnutChartConfig()"
    )
  );

  // Top Wins Chart
  charts.push(
    generateChartCode(
      "topWinsChart",
      "bar",
      "formatters.formatTopWinsChart(data)",
      "getBarChartConfig(true)"
    )
  );

  // Proactive Ratio Chart
  charts.push(
    generateChartCode(
      "proactiveRatioChart",
      "doughnut",
      "formatters.formatProactiveRatioChart(data)",
      "getDoughnutChartConfig()"
    )
  );

  // Proactive Trend Chart
  charts.push(
    generateChartCode(
      "proactiveTrendChart",
      "line",
      "formatters.formatProactiveTrendChart(data)",
      "getLineChartConfig()"
    )
  );

  // Cycle Time by Priority Chart
  charts.push(
    generateChartCode(
      "cycleTimeByPriorityChart",
      "bar",
      "formatters.formatCycleTimeByPriorityChart(data)",
      "getBarChartConfig()"
    )
  );

  // Cycle Time Trend Chart
  charts.push(
    generateChartCode(
      "cycleTimeTrendChart",
      "line",
      "formatters.formatCycleTimeTrendChart(data)",
      "getLineChartConfig()"
    )
  );

  // Unplanned Work Chart
  charts.push(
    generateChartCode(
      "unplannedWorkChart",
      "doughnut",
      "formatters.formatUnplannedWorkChart(data)",
      "getDoughnutChartConfig()"
    )
  );

  // Unplanned Trend Chart
  charts.push(
    generateChartCode(
      "unplannedTrendChart",
      "line",
      "formatters.formatUnplannedTrendChart(data)",
      "getLineChartConfig()"
    )
  );

  // Priority Distribution Chart
  charts.push(
    generateChartCode(
      "priorityDistributionChart",
      "doughnut",
      "formatters.formatPriorityDistributionChart(data)",
      "getDoughnutChartConfig()"
    )
  );

  // Priority Cycle Time Chart
  charts.push(
    generateChartCode(
      "priorityCycleTimeChart",
      "bar",
      "formatters.formatPriorityCycleTimeChart(data)",
      "getBarChartConfig()"
    )
  );

  // Team Balance Chart
  charts.push(
    generateChartCode(
      "teamBalanceChart",
      "bar",
      "formatters.formatTeamBalanceChart(data)",
      "getBarChartConfig()"
    )
  );

  // Estimation Accuracy Chart
  charts.push(
    generateChartCode(
      "estimationAccuracyChart",
      "doughnut",
      "formatters.formatEstimationAccuracyChart(data)",
      "getDoughnutChartConfig()"
    )
  );

  // Estimation by Person Chart
  charts.push(
    generateChartCode(
      "estimationByPersonChart",
      "bar",
      "formatters.formatEstimationByPersonChart(data)",
      "getBarChartConfig()"
    )
  );

  // WIP Patterns Chart
  charts.push(
    generateChartCode(
      "wipPatternsChart",
      "line",
      "formatters.formatWIPPatternsChart(data)",
      "getLineChartConfig()"
    )
  );

  return `
    // Helper functions
    function truncate(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    }
    
    // Chart formatters embedded
    const formatters = ${serializeFormatters()};
    
    // Chart configs embedded
    ${serializeChartConfigs()}
    
    // Initialize charts
    ${charts.join("\n\n")}
  `;
}

/**
 * Generate code for a single chart
 */
function generateChartCode(
  canvasId: string,
  type: string,
  dataFn: string,
  configFn: string
): string {
  return `
    chartInstances['${canvasId}'] = new Chart(document.getElementById('${canvasId}'), {
      type: '${type}',
      data: ${dataFn},
      options: ${configFn}
    });
  `;
}

/**
 * Generate helper content (tables, lists, etc.)
 */
function generateHelperContent(result: AnalysisResult): string {
  const yearComparisonScript = result.yearComparison
    ? `
    // Year-over-Year Comparison
    if (data.yearComparison) {
      const yoySection = document.getElementById('yearComparisonSection');
      if (yoySection) {
        yoySection.style.display = 'block';
        
        document.getElementById('currentYear').textContent = data.yearComparison.currentYear;
        document.getElementById('previousYear').textContent = data.yearComparison.previousYear;
        
        // Issues
        document.getElementById('comp-issues-current').textContent = data.yearComparison.comparison.issues.current;
        document.getElementById('comp-issues-previous').textContent = data.yearComparison.comparison.issues.previous;
        const issuesChange = document.getElementById('comp-issues-change');
        issuesChange.textContent = (data.yearComparison.comparison.issues.percentChange > 0 ? '+' : '') + 
          data.yearComparison.comparison.issues.percentChange.toFixed(0) + '%';
        issuesChange.className = 'change-indicator ' + 
          (data.yearComparison.comparison.issues.percentChange > 5 ? 'positive' : 
           data.yearComparison.comparison.issues.percentChange < -5 ? 'negative' : 'neutral');
        
        // Story Points
        document.getElementById('comp-points-current').textContent = data.yearComparison.comparison.storyPoints.current.toFixed(0);
        document.getElementById('comp-points-previous').textContent = data.yearComparison.comparison.storyPoints.previous.toFixed(0);
        const pointsChange = document.getElementById('comp-points-change');
        pointsChange.textContent = (data.yearComparison.comparison.storyPoints.percentChange > 0 ? '+' : '') + 
          data.yearComparison.comparison.storyPoints.percentChange.toFixed(0) + '%';
        pointsChange.className = 'change-indicator ' + 
          (data.yearComparison.comparison.storyPoints.percentChange > 5 ? 'positive' : 
           data.yearComparison.comparison.storyPoints.percentChange < -5 ? 'negative' : 'neutral');
        
        // Cycle Time (inverse - lower is better)
        document.getElementById('comp-cycle-current').textContent = data.yearComparison.comparison.avgCycleTime.current.toFixed(0) + ' days';
        document.getElementById('comp-cycle-previous').textContent = data.yearComparison.comparison.avgCycleTime.previous.toFixed(0) + ' days';
        const cycleChange = document.getElementById('comp-cycle-change');
        cycleChange.textContent = (data.yearComparison.comparison.avgCycleTime.percentChange > 0 ? '+' : '') + 
          data.yearComparison.comparison.avgCycleTime.percentChange.toFixed(0) + '%';
        cycleChange.className = 'change-indicator ' + 
          (data.yearComparison.comparison.avgCycleTime.percentChange < -5 ? 'positive' : 
           data.yearComparison.comparison.avgCycleTime.percentChange > 5 ? 'negative' : 'neutral');
        
        // High Complexity
        document.getElementById('comp-complexity-current').textContent = data.yearComparison.comparison.highComplexityItems.current;
        document.getElementById('comp-complexity-previous').textContent = data.yearComparison.comparison.highComplexityItems.previous;
        const complexityChange = document.getElementById('comp-complexity-change');
        complexityChange.textContent = (data.yearComparison.comparison.highComplexityItems.percentChange > 0 ? '+' : '') + 
          data.yearComparison.comparison.highComplexityItems.percentChange.toFixed(0) + '%';
        complexityChange.className = 'change-indicator ' + 
          (data.yearComparison.comparison.highComplexityItems.percentChange > 5 ? 'positive' : 
           data.yearComparison.comparison.highComplexityItems.percentChange < -5 ? 'negative' : 'neutral');
        
        // Proactive
        document.getElementById('comp-proactive-current').textContent = data.yearComparison.comparison.proactivePercentage.current.toFixed(0) + '%';
        document.getElementById('comp-proactive-previous').textContent = data.yearComparison.comparison.proactivePercentage.previous.toFixed(0) + '%';
        const proactiveChange = document.getElementById('comp-proactive-change');
        proactiveChange.textContent = (data.yearComparison.comparison.proactivePercentage.percentChange > 0 ? '+' : '') + 
          data.yearComparison.comparison.proactivePercentage.percentChange.toFixed(0) + '%';
        proactiveChange.className = 'change-indicator ' + 
          (data.yearComparison.comparison.proactivePercentage.percentChange > 5 ? 'positive' : 
           data.yearComparison.comparison.proactivePercentage.percentChange < -5 ? 'negative' : 'neutral');
        
        // Estimation
        document.getElementById('comp-estimation-current').textContent = data.yearComparison.comparison.estimationAccuracy.current.toFixed(0) + '%';
        document.getElementById('comp-estimation-previous').textContent = data.yearComparison.comparison.estimationAccuracy.previous.toFixed(0) + '%';
        const estimationChange = document.getElementById('comp-estimation-change');
        estimationChange.textContent = (data.yearComparison.comparison.estimationAccuracy.percentChange > 0 ? '+' : '') + 
          data.yearComparison.comparison.estimationAccuracy.percentChange.toFixed(0) + '%';
        estimationChange.className = 'change-indicator ' + 
          (data.yearComparison.comparison.estimationAccuracy.percentChange > 5 ? 'positive' : 
           data.yearComparison.comparison.estimationAccuracy.percentChange < -5 ? 'negative' : 'neutral');
        
        // Insights
        if (data.yearComparison.insights.improvements.length > 0) {
          document.getElementById('improvementsCard').style.display = 'block';
          document.getElementById('improvementsList').innerHTML = 
            data.yearComparison.insights.improvements.map(i => '<li>' + i + '</li>').join('');
        }
        
        if (data.yearComparison.insights.regressions.length > 0) {
          document.getElementById('regressionsCard').style.display = 'block';
          document.getElementById('regressionsList').innerHTML = 
            data.yearComparison.insights.regressions.map(r => '<li>' + r + '</li>').join('');
        }
      }
    }
    `
    : "";

  return `
    ${yearComparisonScript}
    
    // Project Impact Table
    ${generateProjectTableScript()}
    
    // Versatility Info
    ${generateVersatilityScript()}
    
    // Cycle Time Outliers
    ${generateCycleTimeOutliersScript()}
    
    // Priority Recommendations
    ${generatePriorityRecommendationsScript()}
    
    // Load Balance Info
    ${generateLoadBalanceScript()}
    
    // Seasonal Insights
    ${generateSeasonalInsightsScript()}
    
    // Learning Curves
    ${generateLearningCurvesScript()}
  `;
}

/**
 * Serialize chart formatters as inline functions
 */
function serializeFormatters(): string {
  // These will be available in the browser context
  return `{
    formatProjectImpactChart: ${formatters.formatProjectImpactChart.toString()},
    formatComplexityDistributionChart: ${formatters.formatComplexityDistributionChart.toString()},
    formatTopWinsChart: ${formatters.formatTopWinsChart.toString()},
    formatProactiveRatioChart: ${formatters.formatProactiveRatioChart.toString()},
    formatProactiveTrendChart: ${formatters.formatProactiveTrendChart.toString()},
    formatCycleTimeByPriorityChart: ${formatters.formatCycleTimeByPriorityChart.toString()},
    formatCycleTimeTrendChart: ${formatters.formatCycleTimeTrendChart.toString()},
    formatUnplannedWorkChart: ${formatters.formatUnplannedWorkChart.toString()},
    formatUnplannedTrendChart: ${formatters.formatUnplannedTrendChart.toString()},
    formatPriorityDistributionChart: ${formatters.formatPriorityDistributionChart.toString()},
    formatPriorityCycleTimeChart: ${formatters.formatPriorityCycleTimeChart.toString()},
    formatTeamBalanceChart: ${formatters.formatTeamBalanceChart.toString()},
    formatEstimationAccuracyChart: ${formatters.formatEstimationAccuracyChart.toString()},
    formatEstimationByPersonChart: ${formatters.formatEstimationByPersonChart.toString()},
    formatWIPPatternsChart: ${formatters.formatWIPPatternsChart.toString()}
  }`;
}

/**
 * Serialize chart configurations as inline functions
 */
function serializeChartConfigs(): string {
  return `
    function getBarChartConfig(horizontal = false) {
      return {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 12 } } },
          x: { ticks: { font: { size: 12 } } }
        }
      };
    }
    
    function getLineChartConfig() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 } } },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 12 } } },
          x: { ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 45 } }
        }
      };
    }
    
    function getDoughnutChartConfig() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 12 }, padding: 15 } },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return label + ': ' + value + ' (' + percentage + '%)';
              }
            }
          }
        }
      };
    }
  `;
}

/**
 * Generate JavaScript file content
 */
function generateJavaScript(
  analysisDataJson: string,
  chartInitCode: string,
  helperContentCode: string
): string {
  return `// Jira Retrospective Report - JavaScript
// Generated on ${new Date().toLocaleString()}

// Embedded analysis data
const analysisData = ${analysisDataJson};

// Store chart instances globally for reinitialization
const chartInstances = {};

// Year switching logic
let currentYearData = analysisData;
let isYearSwitchEnabled = false;

if (analysisData.yearData && analysisData.yearData.years.length >= 2) {
  isYearSwitchEnabled = true;
  
  // Use current year's data as the initial display instead of combined data
  currentYearData = analysisData.yearData.currentYearData;
  
  // Show year selector
  const yearSelectorContainer = document.getElementById('yearSelectorContainer');
  yearSelectorContainer.style.display = 'flex';
  
  // Populate year selector
  const yearSelector = document.getElementById('yearSelector');
  analysisData.yearData.years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelector.appendChild(option);
  });
  
  // Set default to current year
  yearSelector.value = analysisData.yearData.currentYear;
  
  // Add change listener
  yearSelector.addEventListener('change', (e) => {
    const selectedYear = parseInt(e.target.value);
    switchToYear(selectedYear);
  });
}

function switchToYear(year) {
  if (!analysisData.yearData) return;
  
  // Determine which dataset to use
  if (year === analysisData.yearData.currentYear) {
    currentYearData = analysisData.yearData.currentYearData;
  } else if (year === analysisData.yearData.previousYear) {
    currentYearData = analysisData.yearData.previousYearData;
  } else {
    return; // Unknown year
  }
  
  // Update summary metrics
  updateSummaryMetrics(currentYearData);
  
  // Destroy existing charts
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  
  // Reinitialize all charts with new data
  initializeCharts(currentYearData);
  
  // Update helper content sections with year-specific data but preserve comparison
  updateHelperContentWithYearData(currentYearData);
}

function updateSummaryMetrics(data) {
  document.getElementById('totalIssues').textContent = data.summary.totalIssues;
  document.getElementById('totalPoints').textContent = data.summary.totalStoryPoints;
  document.getElementById('teamSize').textContent = data.summary.uniqueAssignees.length;
  document.getElementById('avgCycleTime').textContent = 
    Math.round(data.areasForImprovement.cycleTime.overall.mean) + ' days';
}

function updateHelperContent(data) {
  ${helperContentCode}
}

function updateHelperContentWithYearData(yearSpecificData) {
  // Create a merged object that has year-specific data but keeps the comparison
  const mergedData = {
    ...yearSpecificData,
    yearComparison: analysisData.yearComparison
  };
  updateHelperContent(mergedData);
}

function initializeCharts(data) {
  ${chartInitCode}
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Populate initial summary metrics (use currentYearData which may be year-specific)
  document.getElementById('totalIssues').textContent = currentYearData.summary.totalIssues;
  document.getElementById('totalPoints').textContent = currentYearData.summary.totalStoryPoints;
  document.getElementById('teamSize').textContent = currentYearData.summary.uniqueAssignees.length;
  document.getElementById('avgCycleTime').textContent = 
    Math.round(currentYearData.areasForImprovement.cycleTime.overall.mean) + ' days';

  // Initialize all charts with initial data (use currentYearData)
  initializeCharts(currentYearData);
  
  // Initialize helper content
  if (isYearSwitchEnabled) {
    // Use year-specific data with comparison preserved
    updateHelperContentWithYearData(currentYearData);
  } else {
    // No year switching, use full analysisData
    updateHelperContent(analysisData);
  }
});
`;
}
