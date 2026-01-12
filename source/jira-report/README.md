# Jira Retrospective Report Generator

Generate beautiful, interactive HTML reports from Jira CSV exports for team retrospectives and performance analysis.

## Features

- 📊 **11 Comprehensive Metrics**: Project impact, complexity, cycle time, team balance, estimation accuracy, and more
- 📈 **Interactive Charts**: 15 Chart.js visualizations with hover tooltips
- 📅 **Year-over-Year Comparison**: Automatic comparison when data spans multiple years
- 🎨 **Professional Design**: Clean, responsive HTML with print-friendly CSS
- 🔍 **Flexible Filtering**: Filter by year, assignee, or project
- ⚙️ **Configurable**: Custom complexity thresholds and report titles
- 🚀 **Fast**: Processes hundreds of issues in seconds

## Installation

Dependencies are already installed in the parent project. To build:

```bash
npm run jira-report
```

Or compile TypeScript manually:

```bash
./node_modules/.bin/tsc
```

## Usage

### Basic Usage

```bash
node dist/source/jira-report/index.js --input jira-export.csv
```

This generates `report.html` in the current directory.

### Advanced Options

```bash
node dist/source/jira-report/index.js \
  --input source/normalize-jira-data/input/jira-2024.csv \
  --output 2024-retrospective.html \
  --title "2024 Annual Retrospective" \
  --year 2024 \
  --high-threshold 5 \
  --medium-threshold 2
```

### Command-Line Options

| Option                        | Description                             | Default              |
| ----------------------------- | --------------------------------------- | -------------------- |
| `-i, --input <path>`          | Path to Jira CSV export file (required) | -                    |
| `-o, --output <path>`         | Output HTML file path                   | `report.html`        |
| `-t, --title <title>`         | Report title                            | `Team Retrospective` |
| `-y, --year <year>`           | Filter by year                          | All years            |
| `-a, --assignee <email>`      | Filter by assignee email                | All assignees        |
| `-p, --project <label>`       | Filter by project label                 | All projects         |
| `--high-threshold <points>`   | Story points for high complexity        | `8`                  |
| `--medium-threshold <points>` | Story points for medium complexity      | `3`                  |
| `-h, --help`                  | Display help information                | -                    |
| `-V, --version`               | Display version number                  | -                    |

## Exporting from Jira

1. Navigate to your Jira project or filter
2. Click **"Export"** → **"Export CSV"**
3. Ensure these columns are included:
   - Issue Type
   - Priority
   - Summary
   - Custom field (Story Points)
   - Custom field (Story Point Estimate)
   - Assignee
   - Labels (can be multiple columns: "Labels", "Labels.1", "Labels.2", etc.)
   - Created
   - Resolved

The tool automatically handles multiple label columns and timezone conversions.

## Analysis Metrics

### Celebrating Work 🎉

- **Project Impact**: Story points and duration by project
- **Complexity Conquered**: High-value items completed (≥8 points)
- **Proactive Score**: Ratio of planned vs. reactive work
- **Team Versatility**: Cross-functional contributions

### Areas for Improvement 📉

- **Cycle Time**: Average resolution time with outlier detection
- **Unplanned Work**: Percentage of bugs and requests
- **Priority Alignment**: Distribution and cycle time by priority
- **Team Balance**: Workload distribution across team members
- **Estimation Accuracy**: Actual vs. estimated story points
- **Work in Progress**: Monthly patterns and seasonal insights
- **Learning Curves**: Improvement on repeated work patterns

### Year-over-Year Comparison 📅

**Automatic Multi-Year Analysis** - When your CSV contains data from multiple years, the tool automatically detects this and generates a comprehensive comparison between the two most recent years.

**How It Works:**

1. Scans all issues for resolved dates
2. Identifies unique years in the dataset
3. If 2+ years found, runs separate analysis for each year
4. Compares metrics and calculates percentage changes
5. Generates insights about improvements and regressions

**Compared Metrics:**

- **Issues Delivered** - Total count with change percentage
- **Story Points** - Total completed with trend indicator
- **Average Cycle Time** - Days to resolve (lower is better)
- **High Complexity Items** - Count of items ≥8 points
- **Proactive Work** - Percentage of planned work
- **Estimation Accuracy** - Percentage within ±20%

**Visual Indicators:**

- 🟢 **Green (+X%)** - Positive improvement (>5% change)
- 🔴 **Red (-X%)** - Regression or decline (<-5% change)
- ⚪ **Gray (±X%)** - Minimal change (-5% to +5%)

**Output Includes:**

- Dedicated comparison section in HTML with purple gradient design
- Side-by-side comparison cards for all 6 metrics
- Console summary showing key improvements and regressions
- Automatic insights generation (e.g., "Delivered 37% more issues")

**Note:** For cycle time, the direction is inverted since lower values are better. A decrease in cycle time shows as a positive improvement (green).

## Examples

### Year-over-Year Comparison

**Automatic Detection** - If your CSV contains data from 2024 and 2025, the tool automatically generates a comparison without any special flags:

```bash
node dist/source/jira-report/index.js \
  --input multi-year-export.csv \
  --output comparison-report.html \
  --title "2024 vs 2025 Comparison"
```

**Console Output Example:**

```
📅 Year-over-Year Comparison:
   Comparing 2025 vs 2024

   📈 Improvements:
      • Delivered 37% more issues (82 vs 60)
      • Completed 425% more story points (294 vs 56)

   📉 Regressions:
      • Cycle time increased by 61% (60 vs 37 days)
```

The report will include a dedicated "Year-over-Year Comparison" section with:

- Visual comparison cards showing current vs previous values
- Color-coded trend indicators (green/red/gray)
- Automatic insights highlighting key changes
- Responsive design that works on mobile and desktop

**Tip:** To analyze only a single year instead of comparing, use the `--year` filter:

```bash
node dist/source/jira-report/index.js \
  --input multi-year-export.csv \
  --year 2025 \
  --output 2025-only.html
```

### Filter by Year

```bash
node dist/source/jira-report/index.js \
  --input jira-export.csv \
  --year 2024 \
  --output 2024-report.html
```

### Filter by Team Member

```bash
node dist/source/jira-report/index.js \
  --input jira-export.csv \
  --assignee john.doe@example.com \
  --title "John's 2024 Contributions"
```

### Custom Complexity Thresholds

Lower thresholds to identify more items as "high complexity":

```bash
node dist/source/jira-report/index.js \
  --input jira-export.csv \
  --high-threshold 5 \
  --medium-threshold 2
```

## Output

The tool generates a single, self-contained HTML file that includes:

- ✅ All data embedded as JSON
- ✅ Chart.js loaded from CDN
- ✅ Interactive visualizations
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Print-friendly styles
- ✅ No external dependencies needed to view

Simply open the HTML file in any modern web browser.

## Architecture

```
source/jira-report/
├── index.ts                    # CLI entry point
├── types.ts                    # TypeScript interfaces
├── parser.ts                   # CSV parsing
├── transformer.ts              # Data transformation & filtering
├── analyze.ts                  # Analysis orchestrator
├── htmlGenerator.ts            # HTML generation
├── chartFormatters.ts          # Chart data formatting
├── chartConfigs.ts             # Chart.js configurations
├── analyzers/                  # Individual metric analyzers
│   ├── projectImpact.ts
│   ├── complexity.ts
│   ├── proactive.ts
│   ├── versatility.ts
│   ├── cycleTime.ts
│   ├── learningCurve.ts
│   ├── unplannedWork.ts
│   ├── workInProgress.ts
│   ├── estimation.ts
│   ├── priority.ts
│   ├── teamBalance.ts
│   └── yearComparison.ts      # Year-over-year comparison
├── templates/
│   └── reportTemplate.ts      # HTML template
└── utils/
    ├── dateUtils.ts           # Date parsing helpers
    └── statsUtils.ts          # Statistical functions
```

## Troubleshooting

### "Input file not found"

- Check the file path is correct
- Use absolute paths or relative paths from current directory
- Ensure the file has `.csv` extension

### "No issues found after filtering"

- Verify filter criteria (year, assignee, project)
- Check the CSV has data for the specified filters
- Run without filters to see all data

### Charts not rendering

- Ensure you have internet connection (Chart.js loads from CDN)
- Try a different browser
- Check browser console for JavaScript errors

### Permission denied

- Ensure you have read access to input CSV
- Ensure you have write access to output directory
- Try running from a different directory

## Performance

- **90 issues**: < 1 second
- **500 issues**: < 5 seconds
- **1000+ issues**: < 10 seconds

## Dependencies

- **csv-parse**: CSV file parsing
- **date-fns**: Date manipulation
- **commander**: CLI argument parsing
- **Chart.js** (CDN): Chart rendering in browser

## License

Part of the krollins-utilities project.

## Contributing

For issues or feature requests, contact the repository maintainer.
