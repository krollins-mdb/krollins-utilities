/**
 * HTML Content Templates
 * Template functions for generating dynamic HTML content
 */

/**
 * Generate project impact table HTML
 */
export function generateProjectTableScript(): string {
  return `
    const projectTable = document.getElementById('projectImpactTable');
    if (projectTable && data.celebratingWork.projectImpact.length > 0) {
      let tableHTML = '<table><thead><tr><th>Project</th><th>Story Points</th><th>Issues</th><th>Avg Points/Issue</th><th>Duration</th></tr></thead><tbody>';
      data.celebratingWork.projectImpact.forEach(p => {
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
  `;
}

/**
 * Generate versatility info HTML
 */
export function generateVersatilityScript(): string {
  return `
    const versatilityInfo = document.getElementById('versatilityInfo');
    if (versatilityInfo) {
      const crossFunctional = data.celebratingWork.teamVersatility.crossFunctionalContributors;
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
  `;
}

/**
 * Generate cycle time outliers HTML
 */
export function generateCycleTimeOutliersScript(): string {
  return `
    const outliersDiv = document.getElementById('cycleTimeOutliers');
    if (outliersDiv && data.areasForImprovement.cycleTime.outliers.length > 0) {
      const outliers = data.areasForImprovement.cycleTime.outliers.slice(0, 5);
      outliersDiv.innerHTML = \`
        <h4>⚠️ Top Cycle Time Outliers</h4>
        <ul>\${outliers.map(o => 
          '<li><strong>' + o.issue.summary + '</strong> - ' + o.issue.cycleTimeDays + ' days (' + o.standardDeviations.toFixed(1) + 'σ)</li>'
        ).join('')}</ul>
      \`;
    }
  `;
}

/**
 * Generate priority recommendations HTML
 */
export function generatePriorityRecommendationsScript(): string {
  return `
    const recommendationsDiv = document.getElementById('priorityRecommendations');
    if (recommendationsDiv && data.areasForImprovement.priorityAlignment.recommendations.length > 0) {
      recommendationsDiv.innerHTML = \`
        <h4>💡 Recommendations</h4>
        <ul>\${data.areasForImprovement.priorityAlignment.recommendations.map(r => '<li>' + r + '</li>').join('')}</ul>
      \`;
    }
  `;
}

/**
 * Generate load balance info HTML
 */
export function generateLoadBalanceScript(): string {
  return `
    const loadBalanceInfo = document.getElementById('loadBalanceInfo');
    if (loadBalanceInfo && data.areasForImprovement.teamBalance.loadImbalances.length > 0) {
      const imbalances = data.areasForImprovement.teamBalance.loadImbalances;
      loadBalanceInfo.innerHTML = \`
        <h4>⚖️ Load Imbalances Detected</h4>
        <p>The following team members have workload variance &gt;20% from average:</p>
        <ul>\${imbalances.map(i => 
          '<li><strong>' + i.person + '</strong>: ' + (i.variance > 0 ? '+' : '') + i.variance.toFixed(0) + '% from average</li>'
        ).join('')}</ul>
      \`;
    }
  `;
}

/**
 * Generate seasonal insights HTML
 */
export function generateSeasonalInsightsScript(): string {
  return `
    const seasonalDiv = document.getElementById('seasonalInsights');
    if (seasonalDiv && data.areasForImprovement.workInProgress.seasonalInsights.length > 0) {
      seasonalDiv.innerHTML = \`
        <h4>📅 Seasonal Insights</h4>
        <ul>\${data.areasForImprovement.workInProgress.seasonalInsights.map(s => '<li>' + s + '</li>').join('')}</ul>
      \`;
    }
  `;
}

/**
 * Generate learning curves HTML
 */
export function generateLearningCurvesScript(): string {
  return `
    const learningSection = document.getElementById('learningCurveSection');
    const learningContent = document.getElementById('learningCurveContent');
    if (learningContent && data.areasForImprovement.learningCurve.length > 0) {
      let html = '';
      data.areasForImprovement.learningCurve.slice(0, 3).forEach(lc => {
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
