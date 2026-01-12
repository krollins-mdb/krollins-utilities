/**
 * HTML Generator
 * Generates complete HTML report from analysis results
 */

import { writeFile } from "fs/promises";
import type { AnalysisResult } from "./types.js";
import { generateReportHTML } from "./templates/reportTemplate.js";
import * as formatters from "./chartFormatters.js";

/**
 * Generate and save HTML report
 */
export async function generateHTMLReport(
  analysisResult: AnalysisResult,
  outputPath: string,
  title: string = "Team Retrospective"
): Promise<void> {
  console.log("🎨 Generating HTML report...\n");

  // Serialize analysis data to JSON
  const analysisDataJson = JSON.stringify(analysisResult, null, 2);

  // Generate chart initialization code
  const chartInitCode = generateChartInitCode(analysisResult);

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
  });

  // Write to file
  await writeFile(outputPath, html, "utf-8");

  console.log(`✅ HTML report generated: ${outputPath}\n`);
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
      "formatters.formatProjectImpactChart(analysisData)",
      "getBarChartConfig()"
    )
  );

  // Complexity Distribution Chart
  charts.push(
    generateChartCode(
      "complexityDistributionChart",
      "doughnut",
      "formatters.formatComplexityDistributionChart(analysisData)",
      "getDoughnutChartConfig()"
    )
  );

  // Top Wins Chart
  charts.push(
    generateChartCode(
      "topWinsChart",
      "bar",
      "formatters.formatTopWinsChart(analysisData)",
      "getBarChartConfig(true)"
    )
  );

  // Proactive Ratio Chart
  charts.push(
    generateChartCode(
      "proactiveRatioChart",
      "doughnut",
      "formatters.formatProactiveRatioChart(analysisData)",
      "getDoughnutChartConfig()"
    )
  );

  // Proactive Trend Chart
  charts.push(
    generateChartCode(
      "proactiveTrendChart",
      "line",
      "formatters.formatProactiveTrendChart(analysisData)",
      "getLineChartConfig()"
    )
  );

  // Cycle Time by Priority Chart
  charts.push(
    generateChartCode(
      "cycleTimeByPriorityChart",
      "bar",
      "formatters.formatCycleTimeByPriorityChart(analysisData)",
      "getBarChartConfig()"
    )
  );

  // Cycle Time Trend Chart
  charts.push(
    generateChartCode(
      "cycleTimeTrendChart",
      "line",
      "formatters.formatCycleTimeTrendChart(analysisData)",
      "getLineChartConfig()"
    )
  );

  // Unplanned Work Chart
  charts.push(
    generateChartCode(
      "unplannedWorkChart",
      "doughnut",
      "formatters.formatUnplannedWorkChart(analysisData)",
      "getDoughnutChartConfig()"
    )
  );

  // Unplanned Trend Chart
  charts.push(
    generateChartCode(
      "unplannedTrendChart",
      "line",
      "formatters.formatUnplannedTrendChart(analysisData)",
      "getLineChartConfig()"
    )
  );

  // Priority Distribution Chart
  charts.push(
    generateChartCode(
      "priorityDistributionChart",
      "doughnut",
      "formatters.formatPriorityDistributionChart(analysisData)",
      "getDoughnutChartConfig()"
    )
  );

  // Priority Cycle Time Chart
  charts.push(
    generateChartCode(
      "priorityCycleTimeChart",
      "bar",
      "formatters.formatPriorityCycleTimeChart(analysisData)",
      "getBarChartConfig()"
    )
  );

  // Team Balance Chart
  charts.push(
    generateChartCode(
      "teamBalanceChart",
      "bar",
      "formatters.formatTeamBalanceChart(analysisData)",
      "getBarChartConfig()"
    )
  );

  // Estimation Accuracy Chart
  charts.push(
    generateChartCode(
      "estimationAccuracyChart",
      "doughnut",
      "formatters.formatEstimationAccuracyChart(analysisData)",
      "getDoughnutChartConfig()"
    )
  );

  // Estimation by Person Chart
  charts.push(
    generateChartCode(
      "estimationByPersonChart",
      "bar",
      "formatters.formatEstimationByPersonChart(analysisData)",
      "getBarChartConfig()"
    )
  );

  // WIP Patterns Chart
  charts.push(
    generateChartCode(
      "wipPatternsChart",
      "line",
      "formatters.formatWIPPatternsChart(analysisData)",
      "getLineChartConfig()"
    )
  );

  // Add helper content generation
  charts.push(generateHelperContent(result));

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
    new Chart(document.getElementById('${canvasId}'), {
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
  return `
    // Project Impact Table
    const projectTable = document.getElementById('projectImpactTable');
    if (projectTable && analysisData.celebratingWork.projectImpact.length > 0) {
      let tableHTML = '<table><thead><tr><th>Project</th><th>Story Points</th><th>Issues</th><th>Avg Points/Issue</th><th>Duration</th></tr></thead><tbody>';
      analysisData.celebratingWork.projectImpact.forEach(p => {
        tableHTML += \`<tr>
          <td>\${p.projectName}</td>
          <td>\${p.totalStoryPoints}</td>
          <td>\${p.issueCount}</td>
          <td>\${p.avgPointsPerIssue.toFixed(1)}</td>
          <td>\${p.durationDays} days</td>
        </tr>\`;
      });
      tableHTML += '</tbody></table>';
      projectTable.innerHTML = tableHTML;
    }
    
    // Versatility Info
    const versatilityInfo = document.getElementById('versatilityInfo');
    if (versatilityInfo) {
      const crossFunctional = analysisData.celebratingWork.teamVersatility.crossFunctionalContributors;
      if (crossFunctional.length > 0) {
        versatilityInfo.innerHTML = \`
          <h4>🌟 Cross-Functional Contributors</h4>
          <p>The following team members worked across 3+ project themes:</p>
          <ul>\${crossFunctional.map(p => '<li>' + p + '</li>').join('')}</ul>
        \`;
      } else {
        versatilityInfo.innerHTML = '<p>No cross-functional contributors identified (need 3+ project themes)</p>';
      }
    }
    
    // Cycle Time Outliers
    const outliersDiv = document.getElementById('cycleTimeOutliers');
    if (outliersDiv && analysisData.areasForImprovement.cycleTime.outliers.length > 0) {
      const outliers = analysisData.areasForImprovement.cycleTime.outliers.slice(0, 5);
      outliersDiv.innerHTML = \`
        <h4>⚠️ Top Cycle Time Outliers</h4>
        <ul>\${outliers.map(o => 
          '<li><strong>' + o.issue.summary + '</strong> - ' + o.issue.cycleTimeDays + ' days (' + o.standardDeviations.toFixed(1) + 'σ)</li>'
        ).join('')}</ul>
      \`;
    }
    
    // Priority Recommendations
    const recommendationsDiv = document.getElementById('priorityRecommendations');
    if (recommendationsDiv && analysisData.areasForImprovement.priorityAlignment.recommendations.length > 0) {
      recommendationsDiv.innerHTML = \`
        <h4>💡 Recommendations</h4>
        <ul>\${analysisData.areasForImprovement.priorityAlignment.recommendations.map(r => '<li>' + r + '</li>').join('')}</ul>
      \`;
    }
    
    // Load Balance Info
    const loadBalanceInfo = document.getElementById('loadBalanceInfo');
    if (loadBalanceInfo && analysisData.areasForImprovement.teamBalance.loadImbalances.length > 0) {
      const imbalances = analysisData.areasForImprovement.teamBalance.loadImbalances;
      loadBalanceInfo.innerHTML = \`
        <h4>⚖️ Load Imbalances Detected</h4>
        <p>The following team members have workload variance &gt;20% from average:</p>
        <ul>\${imbalances.map(i => 
          '<li><strong>' + i.person + '</strong>: ' + (i.variance > 0 ? '+' : '') + i.variance.toFixed(0) + '% from average</li>'
        ).join('')}</ul>
      \`;
    }
    
    // Seasonal Insights
    const seasonalDiv = document.getElementById('seasonalInsights');
    if (seasonalDiv && analysisData.areasForImprovement.workInProgress.seasonalInsights.length > 0) {
      seasonalDiv.innerHTML = \`
        <h4>📅 Seasonal Insights</h4>
        <ul>\${analysisData.areasForImprovement.workInProgress.seasonalInsights.map(s => '<li>' + s + '</li>').join('')}</ul>
      \`;
    }
    
    // Learning Curves
    const learningSection = document.getElementById('learningCurveSection');
    const learningContent = document.getElementById('learningCurveContent');
    if (learningContent && analysisData.areasForImprovement.learningCurve.length > 0) {
      let html = '';
      analysisData.areasForImprovement.learningCurve.slice(0, 3).forEach(lc => {
        const improvement = lc.improvementPercentage > 0 ? '📈 Improved' : '📉 Slower';
        const color = lc.improvementPercentage > 0 ? '#27ae60' : '#e74c3c';
        html += \`
          <div class="info-box" style="border-left-color: \${color}">
            <h4>\${lc.pattern} (\${lc.occurrences.length} occurrences)</h4>
            <p>
              First: \${lc.firstCycleTime} days | 
              Last: \${lc.lastCycleTime} days | 
              <strong style="color: \${color}">\${improvement} \${Math.abs(lc.improvementPercentage)}%</strong>
            </p>
          </div>
        \`;
      });
      learningContent.innerHTML = html;
    } else if (learningSection) {
      learningSection.style.display = 'none';
    }
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
