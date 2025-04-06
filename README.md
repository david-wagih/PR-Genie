# PR Genie 🧞

An AI-powered code review assistant for your pull requests that provides intelligent code analysis, suggestions, and best practices recommendations.

## Features

- 🤖 AI-powered code review using OpenAI's GPT models
- 🔍 Focus on critical code quality issues, not style nits
- 🔐 Security vulnerability detection
- 🐛 Bug and logic error identification
- ⚠️ Error handling analysis
- ⚡ Optimized for large PRs with parallel processing
- 🌍 Multi-language support with language-specific reviews
- ⚙️ Customizable review standards through `.github/pr-genie-config.json`
- 🔒 Secure handling of API keys and sensitive data

## Optimizations for Large PRs

PR Genie uses several techniques to efficiently handle large pull requests:

- **File Prioritization**: Critical files (security, auth, config) and those with more changes are reviewed first
- **Smart Filtering**: Binary files, generated files, and overly large files are automatically skipped
- **File Limiting**: For very large PRs, only the most important files (up to 30) are reviewed
- **Parallel Processing**: Files are processed in parallel batches for maximum efficiency
- **Language-Based Grouping**: Files are grouped by language to ensure language-specific review

## Supported Languages

PR Genie includes built-in support for:

- TypeScript/JavaScript
- Python
- Java
- Go

And provides default configurations for each language with appropriate file patterns and language-specific review criteria.

## Requirements

- Node.js 20 or later
- GitHub Actions
- OpenAI API key

## Custom Review Standards

You can define your own review standards by creating a `.github/pr-genie-config.json` file:

```json
{
  "languages": {
    "typescript": {
      "fileExtensions": ["ts", "tsx"],
      "maxFileSize": 1000000,
      "ignorePatterns": [
        { "pattern": "**/*.d.ts", "reason": "TypeScript declaration files" }
      ],
      "additionalChecks": ["Your custom TS standards here"],
      "customPrompt": "Your custom review prompt for TypeScript"
    }
  },
  "globalIgnorePatterns": [
    { "pattern": "**/dist/**", "reason": "Build output" }
  ],
  "defaultChecks": ["Your global standards"]
}
```

## Usage Example

```yaml
name: PR Genie Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: david-wagih/pr-genie@v1
        with:
          openai-key: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Optional, defaults to github.token
```

## Security Features

PR Genie includes multiple security features:

- Input validation and sanitization
- Secure token handling
- Rate limit handling with exponential backoff
- Automatic detection of security-critical files for priority review
- Granular permissions management

## Output Parameters

The action provides the following outputs:

- `total_files`: Total number of files reviewed
- `additions`: Total number of lines added
- `deletions`: Total number of lines deleted
- `total_changes`: Total number of lines changed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Format code: `npm run format`
5. Lint code: `npm run lint`
6. Build: `npm run build`

## Support

For support, please open an issue in the GitHub repository.