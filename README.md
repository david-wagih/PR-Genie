# PR Genie 🧞

An AI-powered code review assistant for GitHub pull requests that provides intelligent code analysis, suggestions, and best practices recommendations.

## Features

- 🤖 AI-powered code review using OpenAI's GPT models
- 📊 Detailed PR statistics and change analysis
- 🔍 Smart file filtering and language-specific reviews
- ⚙️ Customizable configuration through `pr-genie.config.json`
- 🔒 Secure handling of API keys and sensitive data
- 🌐 Support for multiple programming languages
- 📝 Automated PR summaries and comments

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

## Usage Example

```yaml
name: PR Genie Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./ # Use PR Genie
        with:
          openai-key: ${{ secrets.OPENAI_API_KEY }}
```

## Troubleshooting

- **Rate Limit Errors**: Ensure your GitHub token has sufficient permissions.
- **OpenAI API Errors**: Verify your OpenAI API key and usage limits.
- **File Size Issues**: Check the `maxFileSize` configuration in `config.ts`.

## Support

For support, please open an issue in the GitHub repository.