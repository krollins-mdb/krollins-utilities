# DevDocs Jira Report Builder

This is a TypeScript app that accepts a CSV file from Jira and generates a report. The report celebrates work that was done and identifies areas for improvement.

## Input Data Structure

The CSV export from Jira contains the following columns:

- **Issue Type**: Task, Writing, EDU Document
- **Priority**: Critical - P2, Major - P3, Minor - P4, Trivial - P5
- **Summary**: Issue title/description
- **Labels**: Multiple columns (Labels, Labels, Labels, Labels) containing tags like:
  - Project themes: `app-services-eol`, `dd-code`, `dd-education`, `dd-grove`, `dd-copier-app`
  - Work types: `proactive`, `bug`, `request`, `feature`
  - Locations/events: `Bucharest`, `budapest`
- **Assignee**: Email addresses (caleb.thompson@mongodb.com, cory.bullinger@mongodb.com, dachary.carey@mongodb.com, kyle.rollins@mongodb.com)
- **Custom field (Story Points Estimate)**: Initial estimate
- **Custom field (Story Points)**: Final story points value
- **Resolved**: Completion date with timezone
- **Created**: Creation date with timezone

## Output Format

The tool generates a single **HTML report** - an interactive dashboard with embedded charts and visualizations.

### Why HTML?

- **Zero dependencies**: Uses Chart.js via CDN, no build step required
- **Self-contained**: Single HTML file includes all data and visualizations
- **Professional**: Interactive charts with hover details and responsive design
- **Shareable**: Open in any browser, no server needed
- **Exportable**: Can be saved as PDF from browser for distribution

### Implementation Approach

- Generate HTML file with embedded JSON data
- Use Chart.js (via CDN) for all visualizations
- Include basic CSS for clean, readable layout
- Make charts responsive and interactive
- Add print styles for PDF export

## Celebrating Work

### Project Impact Tracking

**Purpose**: Show the breadth and depth of major initiatives completed

**Analysis**:

- Group work by project labels (`app-services-eol`, `dd-code`, `dd-education`, `dd-grove`, `dd-copier-app`)
- Calculate total story points per project
- Count number of issues per project
- Identify start and end dates for each initiative
- Calculate project duration and velocity

**Output**:

- Table showing: Project Name, Total Story Points, Issue Count, Date Range, Avg Points/Issue
- Bar chart of story points by project
- Timeline visualization showing concurrent projects

**Example insights**:

- "The team completed 87 story points across 23 issues for the Grove education initiative"
- "App Services EOL represented 15% of team capacity over 6 months"

### Complexity Conquered

**Purpose**: Highlight the team's ability to tackle challenging work

**Analysis**:

- Filter for high-complexity items (≥8 story points)
- Group by assignee to see who tackled complex work
- Calculate what percentage of work was high complexity
- Identify the top 10 most complex items by story points

**Output**:

- "Biggest Wins" list with issue summary, assignee, story points, and resolution time
- Distribution chart showing story point ranges
- Team complexity profile (% of points in high/medium/low complexity)

**Thresholds**:

- High: ≥8 points
- Medium: 3-7 points
- Low: 1-2 points

### Proactive Innovation Score

**Purpose**: Quantify the team's initiative beyond reactive work

**Analysis**:

- Count issues with `proactive` label
- Calculate % of story points that were proactive vs. reactive (bug/request)
- Compare proactive work by team member
- Track proactive work trend over time

**Output**:

- "X% of work was proactive innovation"
- Proactive points per person
- Monthly trend line

### Team Versatility

**Purpose**: Showcase diverse skill applications

**Analysis**:

- Count unique label combinations per person
- Identify cross-functional contributors (worked on 3+ project themes)
- Analyze work type diversity (Task vs. Writing vs. EDU Document)

**Output**:

- Team member skill matrix
- Cross-functional contribution awards

## Areas for Improvement

### Cycle Time Analysis

**Purpose**: Understand how long work takes and identify bottlenecks

**Analysis**:

- Calculate cycle time: (Resolved date - Created date) in days
- Group by priority level (P2, P3, P4, P5)
- Calculate median, mean, p50, p75, p95 cycle times
- Identify outliers (>2 standard deviations from mean)
- Compare cycle time trends by quarter

**Output**:

- Priority vs. Cycle Time table showing if urgent work actually moves faster
- Distribution histogram of cycle times
- Outlier list with reasons (long-running initiatives vs. stuck work)
- Quarterly trend line showing if cycle times are improving

**Questions to answer**:

- Are P2s resolved faster than P4s? (Should be)
- What's the typical cycle time for different story point sizes?
- Which items took unexpectedly long?

### Time to First Resolution (Learning Curve)

**Purpose**: Measure if the team is getting faster at recurring work types

**Analysis**:

- Identify work patterns by summary text similarity or labels
- Group similar issues (e.g., all "Grove X docs" tasks)
- Calculate average cycle time for each occurrence
- Track if later occurrences are faster

**Output**:

- Learning curve charts for recurring work patterns
- "Efficiency gains" metric showing % improvement
- Recommendations for templatizing work that didn't improve

**Example patterns**:

- Grove docs for different languages
- Migration guides
- Admin API examples

### Unplanned Work Ratio

**Purpose**: Understand reactive vs. planned work balance

**Analysis**:

- Count issues with `bug` or `request` labels (reactive)
- Calculate % of story points that were unplanned
- Compare planned vs. unplanned by month/quarter
- Identify team members handling more reactive work

**Output**:

- Reactive work percentage (target: <30%)
- Monthly trend showing if unplanned work is increasing
- Distribution by person (is reactive work balanced?)
- Impact analysis: "Unplanned work consumed X story points that could have been used for planned initiatives"

**Interpretation**:

- High reactive work = team is responsive but may struggle with strategic initiatives
- Very low reactive work = may not be accessible to stakeholders

### Work-in-Progress Patterns

**Purpose**: Identify bottlenecks and seasonal variations

**Analysis**:

- Calculate cycle time by month resolved
- Identify months with longest cycle times (potential bottlenecks)
- Look for seasonal patterns (e.g., slower in conference months, holidays)
- Calculate work overlap (items created in same month with >60 day cycle time)

**Output**:

- Heatmap: Month vs. Average Cycle Time
- Bottleneck months highlighted
- Seasonal insight summary
- WIP recommendations (reduce concurrent projects if cycle times are high)

**Metrics**:

- Average cycle time by resolution month
- % of items with >60 day cycle time per month
- Concurrent projects per month

### Estimation Accuracy

**Purpose**: Improve future planning by understanding estimation patterns

**Analysis**:

- Compare "Story Points Estimate" vs. actual "Story Points"
- Calculate estimation error: (Actual - Estimate) / Estimate
- Identify systematic over/under-estimation
- Group by assignee and work type

**Output**:

- Estimation accuracy percentage (within ±20% = accurate)
- Over vs. under-estimation ratio
- Most accurate estimators
- Work types with most estimation variance
- Recommendations for estimation calibration

### Priority Alignment

**Purpose**: Ensure effort matches stated priorities

**Analysis**:

- Calculate story points by priority level
- Compare actual distribution to ideal/target distribution
- Calculate average cycle time by priority (P2 should be fastest)
- Identify if low-priority work is consuming disproportionate time

**Output**:

- Pie chart: Story points by priority
- Priority vs. Expected priority comparison
- Recommendations (e.g., "Too much P4 work - consider declining or elevating")

**Ideal distribution** (for reference):

- P2 (Critical): 10-20%
- P3 (Major): 30-40%
- P4 (Minor): 40-50%
- P5 (Trivial): <5%

### Team Load Balance

**Purpose**: Ensure workload is fairly distributed

**Analysis**:

- Calculate total story points per team member
- Calculate number of issues per team member
- Identify load imbalances (>20% variance from average)
- Consider work complexity (high-point items) vs. volume (many small items)

**Output**:

- Team member workload table
- Load balance visualization
- Flagged concerns if imbalance exists
- Average points per person per month

## Technical Implementation

### Data Processing Pipeline

1. **Parse CSV**: Read and parse Jira CSV export

   - Handle multiple label columns
   - Parse date strings with timezone support (CDT/CST)
   - Handle empty cells (story point estimates, labels)

2. **Data Transformation**:

   - Flatten label columns into array
   - Parse dates to Date objects
   - Calculate derived fields (cycle time, estimation error)
   - Extract assignee name from email

3. **Analysis Functions**: Create modular analysis functions for each metric

   - Each function takes processed data and returns results
   - Functions should be composable and testable

4. **HTML Generation**: Generate complete HTML report
   - Create HTML template with embedded CSS
   - Serialize analysis data to JSON and embed in script tag
   - Generate Chart.js initialization code for each visualization
   - Write single self-contained HTML file

### Data Models

```typescript
interface JiraIssue {
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

interface AnalysisResult {
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
}
```

### CLI Interface

```bash
# Basic usage
npm run report -- --input data.csv

# With custom output path
npm run report -- --input data.csv --output retrospective-2025.html

# Options
--input, -i      Path to Jira CSV export (required)
--output, -o     Output HTML file path (default: report.html)
--year           Filter by year (default: all)
--assignee       Filter by assignee email
--project        Filter by project label
--title          Report title (default: "Team Retrospective")
```

### Dependencies

- **csv-parse**: CSV parsing
- **date-fns**: Date manipulation and formatting
- **commander**: CLI argument parsing

**No chart libraries needed**: Chart.js is loaded via CDN in the generated HTML

### HTML Report Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>DevDocs 2025 Retrospective</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <style>
      /* Embedded CSS for layout and print styles */
      body {
        font-family: system-ui, sans-serif;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
      }
      section {
        margin: 40px 0;
      }
      .chart-container {
        position: relative;
        height: 400px;
        margin: 20px 0;
      }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
      .metric-card {
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 8px;
      }
      @media print {
        .chart-container {
          height: 300px;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Team Retrospective - 2025</h1>
      <p>Generated on <span id="reportDate"></span></p>
    </header>

    <section id="celebrating-work">
      <h2>🎉 Celebrating Work</h2>

      <div class="metric-grid">
        <div class="metric-card">
          <h3>Total Story Points</h3>
          <p
            class="metric-value"
            id="totalPoints"
          ></p>
        </div>
        <!-- More metric cards -->
      </div>

      <div class="chart-container">
        <canvas id="projectImpactChart"></canvas>
      </div>

      <div class="chart-container">
        <canvas id="complexityChart"></canvas>
      </div>
    </section>

    <section id="improvements">
      <h2>📈 Areas for Improvement</h2>

      <div class="chart-container">
        <canvas id="cycleTimeChart"></canvas>
      </div>

      <div class="chart-container">
        <canvas id="priorityChart"></canvas>
      </div>
    </section>

    <script>
      // Embedded analysis data
      const analysisData = /* JSON from TypeScript analysis */;

      // Chart.js initialization
      new Chart(document.getElementById('projectImpactChart'), {
        type: 'bar',
        data: analysisData.projectImpact,
        options: { responsive: true, maintainAspectRatio: false }
      });
      // More charts...
    </script>
  </body>
</html>
```

### Chart Types Used

- **Bar charts**: Project impact, team workload, complexity distribution
- **Pie/Doughnut charts**: Priority distribution, proactive vs. reactive work
- **Line charts**: Velocity trends, cycle time over time, learning curves
- **Scatter plots**: Story points vs. cycle time (identify outliers)
- **Horizontal bar**: Top 10 biggest wins

## Future Enhancements

1. **Trend Analysis**: Compare year-over-year or quarter-over-quarter
2. **Forecasting**: Predict future velocity based on historical data
3. **GitHub Integration**: Pull PR data to correlate with Jira issues
4. **Interactive Dashboard**: Web-based visualization of metrics
5. **Customizable Thresholds**: Allow users to define what counts as "high complexity" or "long cycle time"
6. **Team Composition Changes**: Account for team members joining/leaving mid-year
7. **External Events**: Tag periods with context (conferences, holidays, major incidents)
