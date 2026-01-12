/**
 * Year-over-Year Comparison Template
 */

interface ComparisonMetric {
  current: number;
  previous: number;
  percentChange: number;
}

interface YearComparisonData {
  currentYear: number;
  previousYear: number;
  comparison: {
    issues: ComparisonMetric;
    storyPoints: ComparisonMetric;
    avgCycleTime: ComparisonMetric;
    highComplexityItems: ComparisonMetric;
    proactivePercentage: ComparisonMetric;
    estimationAccuracy: ComparisonMetric;
  };
  insights: {
    improvements: string[];
    regressions: string[];
  };
}

/**
 * Generate change indicator class based on value and inverse flag
 */
function getChangeClass(
  percentChange: number,
  inverse: boolean = false
): string {
  const threshold = 5;
  const isPositive = inverse
    ? percentChange < -threshold
    : percentChange > threshold;
  const isNegative = inverse
    ? percentChange > threshold
    : percentChange < -threshold;

  if (isPositive) return "positive";
  if (isNegative) return "negative";
  return "neutral";
}

/**
 * Generate JavaScript code to populate year-over-year comparison section
 */
export function generateYearComparisonScript(data: YearComparisonData): string {
  return `
    const yoySection = document.getElementById('yearComparisonSection');
    if (yoySection) {
      yoySection.style.display = 'block';
      
      document.getElementById('currentYear').textContent = ${data.currentYear};
      document.getElementById('previousYear').textContent = ${
        data.previousYear
      };
      
      // Issues
      document.getElementById('comp-issues-current').textContent = ${
        data.comparison.issues.current
      };
      document.getElementById('comp-issues-previous').textContent = ${
        data.comparison.issues.previous
      };
      const issuesChange = document.getElementById('comp-issues-change');
      issuesChange.textContent = (${
        data.comparison.issues.percentChange
      } > 0 ? '+' : '') + 
        ${data.comparison.issues.percentChange.toFixed(0)} + '%';
      issuesChange.className = 'change-indicator ${getChangeClass(
        data.comparison.issues.percentChange
      )}';
      
      // Story Points
      document.getElementById('comp-points-current').textContent = ${data.comparison.storyPoints.current.toFixed(
        0
      )};
      document.getElementById('comp-points-previous').textContent = ${data.comparison.storyPoints.previous.toFixed(
        0
      )};
      const pointsChange = document.getElementById('comp-points-change');
      pointsChange.textContent = (${
        data.comparison.storyPoints.percentChange
      } > 0 ? '+' : '') + 
        ${data.comparison.storyPoints.percentChange.toFixed(0)} + '%';
      pointsChange.className = 'change-indicator ${getChangeClass(
        data.comparison.storyPoints.percentChange
      )}';
      
      // Cycle Time (inverse - lower is better)
      document.getElementById('comp-cycle-current').textContent = ${data.comparison.avgCycleTime.current.toFixed(
        0
      )} + ' days';
      document.getElementById('comp-cycle-previous').textContent = ${data.comparison.avgCycleTime.previous.toFixed(
        0
      )} + ' days';
      const cycleChange = document.getElementById('comp-cycle-change');
      cycleChange.textContent = (${
        data.comparison.avgCycleTime.percentChange
      } > 0 ? '+' : '') + 
        ${data.comparison.avgCycleTime.percentChange.toFixed(0)} + '%';
      cycleChange.className = 'change-indicator ${getChangeClass(
        data.comparison.avgCycleTime.percentChange,
        true
      )}';
      
      // High Complexity
      document.getElementById('comp-complexity-current').textContent = ${
        data.comparison.highComplexityItems.current
      };
      document.getElementById('comp-complexity-previous').textContent = ${
        data.comparison.highComplexityItems.previous
      };
      const complexityChange = document.getElementById('comp-complexity-change');
      complexityChange.textContent = (${
        data.comparison.highComplexityItems.percentChange
      } > 0 ? '+' : '') + 
        ${data.comparison.highComplexityItems.percentChange.toFixed(0)} + '%';
      complexityChange.className = 'change-indicator ${getChangeClass(
        data.comparison.highComplexityItems.percentChange
      )}';
      
      // Proactive
      document.getElementById('comp-proactive-current').textContent = ${data.comparison.proactivePercentage.current.toFixed(
        0
      )} + '%';
      document.getElementById('comp-proactive-previous').textContent = ${data.comparison.proactivePercentage.previous.toFixed(
        0
      )} + '%';
      const proactiveChange = document.getElementById('comp-proactive-change');
      proactiveChange.textContent = (${
        data.comparison.proactivePercentage.percentChange
      } > 0 ? '+' : '') + 
        ${data.comparison.proactivePercentage.percentChange.toFixed(0)} + '%';
      proactiveChange.className = 'change-indicator ${getChangeClass(
        data.comparison.proactivePercentage.percentChange
      )}';
      
      // Estimation
      document.getElementById('comp-estimation-current').textContent = ${data.comparison.estimationAccuracy.current.toFixed(
        0
      )} + '%';
      document.getElementById('comp-estimation-previous').textContent = ${data.comparison.estimationAccuracy.previous.toFixed(
        0
      )} + '%';
      const estimationChange = document.getElementById('comp-estimation-change');
      estimationChange.textContent = (${
        data.comparison.estimationAccuracy.percentChange
      } > 0 ? '+' : '') + 
        ${data.comparison.estimationAccuracy.percentChange.toFixed(0)} + '%';
      estimationChange.className = 'change-indicator ${getChangeClass(
        data.comparison.estimationAccuracy.percentChange
      )}';
      
      // Insights
      if (${data.insights.improvements.length} > 0) {
        document.getElementById('improvementsCard').style.display = 'block';
        document.getElementById('improvementsList').innerHTML = 
          data.yearComparison.insights.improvements.map(i => '<li>' + i + '</li>').join('');
      }
      
      if (${data.insights.regressions.length} > 0) {
        document.getElementById('regressionsCard').style.display = 'block';
        document.getElementById('regressionsList').innerHTML = 
          data.yearComparison.insights.regressions.map(r => '<li>' + r + '</li>').join('');
      }
    }
  `;
}
