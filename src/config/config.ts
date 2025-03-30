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

Please analyze the code and provide a review in the following format:

{
  "estimatedEffort": {
    "score": number, // 1-5 scale
    "explanation": string // Brief explanation of the score
  },
  "relevantTests": {
    "exists": boolean,
    "details": string // Description of test coverage or what tests are needed
  },
  "possibleIssues": [
    {
      "title": string,
      "description": string,
      "severity": "high" | "medium" | "low",
      "lineNumbers": number[],
      "suggestion": string
    }
  ],
  "securityConcerns": [
    {
      "title": string,
      "description": string,
      "severity": "high" | "medium" | "low",
      "lineNumbers": number[],
      "suggestion": string
    }
  ],
  "codeQuality": {
    "strengths": string[],
    "improvements": [
      {
        "title": string,
        "description": string,
        "lineNumbers": number[],
        "suggestion": string
      }
    ]
  }
}

Focus on:
1. Security vulnerabilities and best practices
2. Performance implications and optimizations
3. Code maintainability and readability
4. Error handling and edge cases
5. {language}-specific best practices
6. Project architecture and design patterns

Additional checks to consider:
{additionalChecks}

Code to review:
\`\`\`{language}
{code}
\`\`\``,
  defaultChecks: ['Code organization', 'Error handling', 'Documentation', 'Testing considerations'],
};
