# PR Genie 🤖

An AI-powered code review assistant for GitHub pull requests that provides intelligent code analysis, suggestions, and best practices recommendations.

## Features

- 🤖 AI-powered code review using OpenAI's GPT models
- 📊 Detailed PR statistics and change analysis
- 🔍 Smart file filtering and language-specific reviews
- ⚙️ Customizable configuration through `pr-genie.config.json`
- 🔒 Secure handling of API keys and sensitive data
- 🌐 Support for multiple programming languages
- 📝 Automated PR summaries and comments

## Usage

Add the following to your workflow file (`.github/workflows/pr-review.yml`):

```yaml
name: PR Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: PR Genie Review
        uses: david-wagih/PR-Genie@v1
        with:
          openai-key: ${{ secrets.OPENAI_API_KEY }}
          config-file: pr-genie.config.json  # Optional
```

## Configuration

Create a `pr-genie.config.json` file in your repository root to customize the review process:

```json
{
  "languages": {
    "typescript": {
      "extensions": [".ts", ".tsx"],
      "maxFileSize": 1000,
      "ignorePatterns": ["**/*.test.ts", "**/*.spec.ts"],
      "checks": ["type-safety", "error-handling", "security"]
    }
  }
}
```

### Configuration Options

#### Language-Specific Settings
- `extensions`: File extensions to include
- `maxFileSize`: Maximum file size in KB to review
- `ignorePatterns`: Glob patterns to ignore
- `checks`: Specific checks to perform

#### Global Settings
- `ignorePatterns`: Global patterns to ignore
- `maxFileSize`: Default maximum file size
- `defaultChecks`: Default checks to perform

## Security

- 🔒 Uses GitHub Secrets for API keys
- 🔐 Minimal permissions required
- 🛡️ Prevents execution on forked repositories
- 🔍 Input validation and sanitization
- 🚫 Rate limiting protection

## Outputs

The action provides the following outputs:
- `total_files`: Total number of files reviewed
- `additions`: Total number of lines added
- `deletions`: Total number of lines deleted
- `total_changes`: Total number of lines changed

## Requirements

- Node.js 20 or later
- GitHub Actions
- OpenAI API key

## Permissions

The action requires the following permissions:
- `contents: read` - To read repository contents
- `pull-requests: write` - To post review comments

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Testing

To test the action locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`

## Support

For support, please open an issue in the GitHub repository. 