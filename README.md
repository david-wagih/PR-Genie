# PR Analysis Action

📊 A GitHub Action that provides detailed analysis of pull requests, helping teams understand the scope and impact of changes.

## Features

- 📁 Counts the number of files changed
- ✨ Calculates lines added and removed
- 📈 Provides a detailed breakdown of changes per file
- 💬 Posts results as a comment on the PR
- 🔄 Updates on PR synchronization

## Example Output

```markdown
## 📊 Pull Request Analysis

### Overview
- 📁 Files changed: 3
- ✨ Lines added: 150
- 🗑️ Lines removed: 50
- 📈 Total changes: 200

### Files Changed
- `src/index.ts` (+100/-30)
- `README.md` (+40/-15)
- `package.json` (+10/-5)
```

## Usage

Add this to your workflow file:

```yaml
name: PR Analysis
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  pull-requests: write  # Required for posting comments
  contents: read       # Required for reading PR content

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run PR Analysis
        uses: david-wagih/pr-analysis-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.pull_request.number }}
```

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `github-token` | GitHub token for API access | Yes | N/A |
| `pr-number` | Pull request number to analyze | Yes | N/A |

## Outputs

| Name | Description |
|------|-------------|
| `total_files` | Number of files changed |
| `additions` | Number of lines added |
| `deletions` | Number of lines removed |
| `total_changes` | Total number of changes |

## Use Cases

- 🔍 Quick assessment of PR size and complexity
- 📈 Tracking changes across multiple files
- 📊 Generating PR statistics for team metrics
- 🤖 Automated PR review workflows

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [david-wagih] 