# PR Analysis Action

A GitHub Action that analyzes pull requests and provides a detailed summary of changes.

## Features

- Counts the number of files changed
- Calculates lines added and removed
- Provides a detailed breakdown of changes per file
- Posts results as a comment on the PR

## Usage

Add this to your workflow file:

```yaml
name: PR Analysis
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run PR Analysis
        uses: your-username/pr-analysis-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.pull_request.number }}
```

## Inputs

| Name | Description | Required |
|------|-------------|----------|
| `github-token` | GitHub token for API access | Yes |
| `pr-number` | Pull request number to analyze | Yes |

## Outputs

| Name | Description |
|------|-------------|
| `total_files` | Number of files changed |
| `additions` | Number of lines added |
| `deletions` | Number of lines removed |
| `total_changes` | Total number of changes |

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the action:
```bash
npm run build
```

3. Run tests:
```bash
npm test
```

## License

MIT 