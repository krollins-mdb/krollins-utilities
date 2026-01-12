/**
 * HTML Report Template
 * Generates the HTML structure for the retrospective report
 */

export interface TemplateData {
  title: string;
  generatedDate: string;
  analysisDataJson: string;
  chartInitCode: string;
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
    <h1>${data.title}</h1>
    <p class="generated-date">Generated on ${data.generatedDate}</p>
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
    
    // Populate summary metrics
    document.getElementById('totalIssues').textContent = analysisData.summary.totalIssues;
    document.getElementById('totalPoints').textContent = analysisData.summary.totalStoryPoints;
    document.getElementById('teamSize').textContent = analysisData.summary.uniqueAssignees.length;
    document.getElementById('avgCycleTime').textContent = 
      Math.round(analysisData.areasForImprovement.cycleTime.overall.mean) + ' days';

    // Initialize all charts
    ${data.chartInitCode}
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

    header h1 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .generated-date {
      color: #7f8c8d;
      font-size: 0.9em;
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
