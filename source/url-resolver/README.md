# URL Resolver

This utility resolves source `.txt` files from the MongoDB documentation to their production URLs and exports the mappings to a CSV file.

## Purpose

Maps documentation source files (e.g., from `docs-mongodb-internal/content/app-services/source`) to their corresponding production URLs on `mongodb.com`. This is useful for:

- Generating URL mappings for analysis
- Tracking documentation structure
- Creating redirect configurations
- Cross-referencing source files with published pages

## How It Works

1. **Scans** the source directory recursively for all `.txt` files
2. **Resolves** each file to a production URL by:
   - Removing the `.txt` extension
   - Preserving directory structure in the URL path
   - Adding trailing slashes
   - Special handling for `index.txt` files (map to parent directory)
3. **Outputs** the mappings to a CSV file with columns: `Source File Path`, `Production URL`

## Usage

### Run the script

```bash
# From the workspace root
npm run url-resolver

# Or using ts-node directly
npx ts-node source/url-resolver/index.ts
```

### Configuration

Edit the `config` object in [index.ts](index.ts#L11-L17) to customize:

- `sourceDir`: Path to the source directory containing `.txt` files
- `baseUrl`: Base production URL for the documentation site
- `outputCsvPath`: Path where the CSV file should be written

### Example Mappings

| Source File                           | Production URL                                                              |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `source/index.txt`                    | `https://www.mongodb.com/docs/atlas/app-services/`                          |
| `source/authentication.txt`           | `https://www.mongodb.com/docs/atlas/app-services/authentication/`           |
| `source/authentication/anonymous.txt` | `https://www.mongodb.com/docs/atlas/app-services/authentication/anonymous/` |

## Output

The script generates a CSV file at `source/url-resolver/output/app-services-urls.csv` with all mappings.

## Files

- [index.ts](index.ts) - Main entry point and configuration
- [scanner.ts](scanner.ts) - Recursively scans directories for `.txt` files
- [resolver.ts](resolver.ts) - Converts file paths to production URLs
- [csv-writer.ts](csv-writer.ts) - Writes mappings to CSV format
- [types.ts](types.ts) - TypeScript type definitions
