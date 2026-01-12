# Jira Retrospective Report Generator

Generate beautiful, interactive HTML reports from Jira CSV exports for team retrospectives and performance analysis.

## Features

- 📊 **11 Comprehensive Metrics**: Project impact, complexity, cycle time, team balance, estimation accuracy, and more
- 📈 **Interactive Charts**: 15 Chart.js visualizations with hover tooltips
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

## Examples

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
│   └── teamBalance.ts
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
