/**
 * HTML Report Template
 * Generates the HTML structure for the retrospective report
 */

export interface TemplateData {
  title: string;
  generatedDate: string;
  analysisDataJson: string;
  chartInitCode: string;
  helperContentCode: string;
}

/**
 * Generate complete HTML report
 */
export function generateReportHTML(data: TemplateData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="header-title">
        <h1>${data.title}</h1>
        <p class="generated-date">Generated on ${data.generatedDate}</p>
      </div>
      <div class="year-selector-container" id="yearSelectorContainer" style="display: none;">
        <label for="yearSelector">View Year:</label>
        <select id="yearSelector" class="year-selector">
          <!-- Options populated by JavaScript -->
        </select>
      </div>
    </div>
  </header>

  <main>
    <section class="summary">
      <h2>📊 Overview</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <h3>Total Issues</h3>
          <p class="metric-value" id="totalIssues">-</p>
        </div>
        <div class="metric-card">
          <h3>Total Story Points</h3>
          <p class="metric-value" id="totalPoints">-</p>
        </div>
        <div class="metric-card">
          <h3>Team Size</h3>
          <p class="metric-value" id="teamSize">-</p>
        </div>
        <div class="metric-card">
          <h3>Avg Cycle Time</h3>
          <p class="metric-value" id="avgCycleTime">-</p>
        </div>
      </div>
    </section>

    <!-- Year-over-Year Comparison (only shown if data available) -->
    <section class="year-comparison" id="yearComparisonSection" style="display: none;">
      <h2>📅 Year-over-Year Comparison</h2>
      
      <div class="comparison-header" id="comparisonHeader">
        <p>Comparing <strong id="currentYear">-</strong> vs <strong id="previousYear">-</strong></p>
      </div>

      <div class="subsection">
        <h3>Key Metrics Comparison</h3>
        <div class="comparison-grid">
          <div class="comparison-card">
            <h4>Issues Delivered</h4>
            <div class="comparison-values">
              <span class="current-value" id="comp-issues-current">-</span>
              <span class="change-indicator" id="comp-issues-change">-</span>
            </div>
            <span class="previous-value">Previous: <span id="comp-issues-previous">-</span></span>
          </div>
          
          <div class="comparison-card">
            <h4>Story Points</h4>
            <div class="comparison-values">
              <span class="current-value" id="comp-points-current">-</span>
              <span class="change-indicator" id="comp-points-change">-</span>
            </div>
            <span class="previous-value">Previous: <span id="comp-points-previous">-</span></span>
          </div>
          
          <div class="comparison-card">
            <h4>Avg Cycle Time</h4>
            <div class="comparison-values">
              <span class="current-value" id="comp-cycle-current">-</span>
              <span class="change-indicator" id="comp-cycle-change">-</span>
            </div>
            <span class="previous-value">Previous: <span id="comp-cycle-previous">-</span></span>
          </div>
          
          <div class="comparison-card">
            <h4>High Complexity Items</h4>
            <div class="comparison-values">
              <span class="current-value" id="comp-complexity-current">-</span>
              <span class="change-indicator" id="comp-complexity-change">-</span>
            </div>
            <span class="previous-value">Previous: <span id="comp-complexity-previous">-</span></span>
          </div>
          
          <div class="comparison-card">
            <h4>Proactive Work</h4>
            <div class="comparison-values">
              <span class="current-value" id="comp-proactive-current">-</span>
              <span class="change-indicator" id="comp-proactive-change">-</span>
            </div>
            <span class="previous-value">Previous: <span id="comp-proactive-previous">-</span></span>
          </div>
          
          <div class="comparison-card">
            <h4>Estimation Accuracy</h4>
            <div class="comparison-values">
              <span class="current-value" id="comp-estimation-current">-</span>
              <span class="change-indicator" id="comp-estimation-change">-</span>
            </div>
            <span class="previous-value">Previous: <span id="comp-estimation-previous">-</span></span>
          </div>
        </div>
      </div>

      <div class="subsection">
        <div class="insights-grid">
          <div class="insights-card improvements" id="improvementsCard" style="display: none;">
            <h4>📈 Improvements</h4>
            <ul id="improvementsList"></ul>
          </div>
          
          <div class="insights-card regressions" id="regressionsCard" style="display: none;">
            <h4>📉 Areas to Watch</h4>
            <ul id="regressionsList"></ul>
          </div>
        </div>
      </div>
    </section>

    <section class="celebrating-work">
      <h2>🎉 Celebrating Work</h2>
      
      <div class="subsection">
        <h3>Project Impact</h3>
        <div class="chart-container">
          <canvas id="projectImpactChart"></canvas>
        </div>
        <div id="projectImpactTable" class="data-table"></div>
      </div>

      <div class="subsection">
        <h3>Complexity Conquered</h3>
        <div class="chart-row">
          <div class="chart-container half">
            <canvas id="complexityDistributionChart"></canvas>
          </div>
          <div class="chart-container half">
            <canvas id="topWinsChart"></canvas>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Proactive Innovation</h3>
        <div class="chart-row">
          <div class="chart-container half">
            <canvas id="proactiveRatioChart"></canvas>
          </div>
          <div class="chart-container half">
            <canvas id="proactiveTrendChart"></canvas>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Team Versatility</h3>
        <div id="versatilityInfo" class="info-box"></div>
      </div>
    </section>

    <section class="areas-for-improvement">
      <h2>📈 Areas for Improvement</h2>

      <div class="subsection">
        <h3>Cycle Time Analysis</h3>
        <div class="chart-row">
          <div class="chart-container half">
            <canvas id="cycleTimeByPriorityChart"></canvas>
          </div>
          <div class="chart-container half">
            <canvas id="cycleTimeTrendChart"></canvas>
          </div>
        </div>
        <div id="cycleTimeOutliers" class="info-box"></div>
      </div>

      <div class="subsection">
        <h3>Unplanned Work Ratio</h3>
        <div class="chart-row">
          <div class="chart-container half">
            <canvas id="unplannedWorkChart"></canvas>
          </div>
          <div class="chart-container half">
            <canvas id="unplannedTrendChart"></canvas>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Priority Alignment</h3>
        <div class="chart-row">
          <div class="chart-container half">
            <canvas id="priorityDistributionChart"></canvas>
          </div>
          <div class="chart-container half">
            <canvas id="priorityCycleTimeChart"></canvas>
          </div>
        </div>
        <div id="priorityRecommendations" class="recommendations"></div>
      </div>

      <div class="subsection">
        <h3>Team Load Balance</h3>
        <div class="chart-container">
          <canvas id="teamBalanceChart"></canvas>
        </div>
        <div id="loadBalanceInfo" class="info-box"></div>
      </div>

      <div class="subsection">
        <h3>Estimation Accuracy</h3>
        <div class="chart-row">
          <div class="chart-container half">
            <canvas id="estimationAccuracyChart"></canvas>
          </div>
          <div class="chart-container half">
            <canvas id="estimationByPersonChart"></canvas>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Work Patterns & Bottlenecks</h3>
        <div class="chart-container">
          <canvas id="wipPatternsChart"></canvas>
        </div>
        <div id="seasonalInsights" class="info-box"></div>
      </div>

      <div class="subsection" id="learningCurveSection">
        <h3>Learning Curves</h3>
        <div id="learningCurveContent"></div>
      </div>
    </section>
  </main>

  <footer>
    <p>Generated by Jira Retrospective Report Generator</p>
  </footer>

  <script>
    // Embedded analysis data
    const analysisData = ${data.analysisDataJson};
    
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
      ${data.helperContentCode}
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
      ${data.chartInitCode}
    }

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
  </script>
</body>
</html>`;
}

/**
 * Get CSS styles for the report
 */
function getStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .header-title {
      flex: 1;
    }

    header h1 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .generated-date {
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .year-selector-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8f9fa;
      padding: 12px 20px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .year-selector-container label {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9em;
      white-space: nowrap;
    }

    .year-selector {
      padding: 8px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      background: white;
      color: #2c3e50;
      font-size: 0.95em;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 100px;
    }

    .year-selector:hover {
      border-color: #3498db;
    }

    .year-selector:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    main {
      max-width: 1400px;
      margin: 0 auto;
    }

    section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 25px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }

    h3 {
      color: #34495e;
      margin-bottom: 15px;
    }

    .subsection {
      margin-bottom: 40px;
    }

    .subsection:last-child {
      margin-bottom: 0;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .metric-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .metric-card h3 {
      font-size: 0.9em;
      color: #6c757d;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #3498db;
    }

    /* Year Comparison Styles */
    .year-comparison {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      margin: 30px 0;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .year-comparison h2 {
      color: white;
      margin-bottom: 15px;
    }

    .comparison-header {
      text-align: center;
      font-size: 1.1em;
      margin-bottom: 30px;
      opacity: 0.95;
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }

    .comparison-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .comparison-card h4 {
      color: white;
      font-size: 0.9em;
      margin-bottom: 15px;
      opacity: 0.9;
      font-weight: 600;
    }

    .comparison-values {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .current-value {
      font-size: 2em;
      font-weight: bold;
      color: white;
    }

    .change-indicator {
      font-size: 1em;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .change-indicator.positive {
      background: #27ae60;
      color: white;
    }

    .change-indicator.negative {
      background: #e74c3c;
      color: white;
    }

    .change-indicator.neutral {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }

    .previous-value {
      font-size: 0.85em;
      opacity: 0.8;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }

    .insights-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 25px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .insights-card h4 {
      color: white;
      margin-bottom: 15px;
      font-size: 1.1em;
    }

    .insights-card ul {
      list-style: none;
      padding: 0;
    }

    .insights-card li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      line-height: 1.5;
    }

    .insights-card li:last-child {
      border-bottom: none;
    }

    .insights-card.improvements {
      border-left: 4px solid #27ae60;
    }

    .insights-card.regressions {
      border-left: 4px solid #f39c12;
    }

    .chart-container {
      position: relative;
      height: 400px;
      margin: 20px 0;
    }

    .chart-container.half {
      height: 350px;
    }

    .chart-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .data-table {
      overflow-x: auto;
      margin-top: 20px;
    }

    .data-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }

    .data-table tr:hover {
      background: #f8f9fa;
    }

    .info-box {
      background: #e7f3ff;
      border-left: 4px solid #3498db;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .info-box h4 {
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .info-box ul {
      margin-left: 20px;
    }

    .info-box li {
      margin: 5px 0;
    }

    .recommendations {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .recommendations h4 {
      margin-bottom: 10px;
      color: #856404;
    }

    .recommendations ul {
      margin-left: 20px;
    }

    .recommendations li {
      margin: 8px 0;
      color: #856404;
    }

    footer {
      text-align: center;
      padding: 20px;
      color: #7f8c8d;
      font-size: 0.9em;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .year-selector-container {
        width: 100%;
        justify-content: space-between;
      }

      .comparison-grid {
        grid-template-columns: 1fr;
      }
      
      .insights-grid {
        grid-template-columns: 1fr;
      }
      
      .comparison-card {
        padding: 15px;
      }
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      section {
        box-shadow: none;
        page-break-inside: avoid;
      }

      .chart-container {
        height: 300px;
      }

      .chart-container.half {
        height: 250px;
      }
    }

    @media (max-width: 768px) {
      .chart-row {
        grid-template-columns: 1fr;
      }

      .metric-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;
}
