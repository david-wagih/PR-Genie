import { ReviewConfig, LanguageConfig } from '../types';

export const DEFAULT_LANGUAGE_CONFIG: LanguageConfig = {
  fileExtensions: [],
  maxFileSize: 1000000, // 1MB
  ignorePatterns: [],
  additionalChecks: [],
};

export const DEFAULT_REVIEW_CONFIG: ReviewConfig = {
  languages: {
    typescript: {
      fileExtensions: ['ts', 'tsx'],
      maxFileSize: 1000000,
      ignorePatterns: [
        { pattern: '**/*.d.ts', reason: 'TypeScript declaration files' },
        { pattern: '**/node_modules/**', reason: 'Dependencies' },
        { pattern: '**/dist/**', reason: 'Build output' },
      ],
      additionalChecks: [
        'TypeScript type safety',
        'Interface and type definitions',
        'Generic type usage',
      ],
    },
    javascript: {
      fileExtensions: ['js', 'jsx'],
      maxFileSize: 1000000,
      ignorePatterns: [
        { pattern: '**/node_modules/**', reason: 'Dependencies' },
        { pattern: '**/dist/**', reason: 'Build output' },
      ],
      additionalChecks: ['ESLint compliance', 'Modern JavaScript features', 'Async/await patterns'],
    },
    python: {
      fileExtensions: ['py'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/__pycache__/**', reason: 'Python cache files' },
        { pattern: '**/*.pyc', reason: 'Python compiled files' },
        { pattern: '**/venv/**', reason: 'Virtual environment' },
      ],
      additionalChecks: ['PEP 8 compliance', 'Type hints', 'Docstring coverage'],
    },
    java: {
      fileExtensions: ['java'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/target/**', reason: 'Build output' },
        { pattern: '**/*.class', reason: 'Compiled files' },
      ],
      additionalChecks: ['Java coding standards', 'Exception handling', 'Design patterns'],
    },
    ruby: {
      fileExtensions: ['rb'],
      maxFileSize: 1000000,
      ignorePatterns: [
        { pattern: '**/vendor/**', reason: 'Dependencies' },
        { pattern: '**/*.gem', reason: 'Ruby gems' },
      ],
      additionalChecks: ['Ruby style guide compliance', 'RSpec tests'],
    },
    go: {
      fileExtensions: ['go'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/vendor/**', reason: 'Dependencies' },
        { pattern: '**/*.mod', reason: 'Go modules' },
      ],
      additionalChecks: ['Go idiomatic code', 'Unit tests'],
    },
  },
  globalIgnorePatterns: [
    { pattern: '**/.git/**', reason: 'Git repository' },
    { pattern: '**/.github/**', reason: 'GitHub configuration' },
    { pattern: '**/coverage/**', reason: 'Test coverage reports' },
    { pattern: '**/*.min.*', reason: 'Minified files' },
    { pattern: '**/*.map', reason: 'Source maps' },
  ],
  defaultMaxFileSize: 1000000,
  defaultPrompt: `You are an expert code reviewer with deep expertise in {language}. Review the following code changes and provide a comprehensive analysis.

Focus on:
1. Security vulnerabilities and best practices
2. Performance implications and optimizations
3. Code maintainability and readability
4. Error handling and edge cases
5. {language}-specific best practices
6. Project architecture and design patterns

For large PRs, prioritize:
- Critical files (e.g., configuration, security-sensitive files)
- Files with the most changes

Provide your feedback in the following format:
{
  "summary": string, // High-level summary of the review
  "issues": [
    {
      "title": string,
      "description": string,
      "severity": "high" | "medium" | "low",
      "lineNumbers": number[],
      "suggestion": string
    }
  ],
  "recommendations": string[] // General recommendations for the PR
}

Code to review:
\`\`\`{language}
{code}
\`\`\``,
  defaultChecks: ['Code organization', 'Error handling', 'Documentation', 'Testing considerations'],
};
