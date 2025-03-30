import { ReviewConfig, LanguageConfig, FilePattern } from '../types';

export const DEFAULT_LANGUAGE_CONFIG: LanguageConfig = {
  fileExtensions: [],
  maxFileSize: 1000000, // 1MB
  ignorePatterns: [],
  additionalChecks: []
};

export const DEFAULT_REVIEW_CONFIG: ReviewConfig = {
  languages: {
    typescript: {
      fileExtensions: ['ts', 'tsx'],
      maxFileSize: 1000000,
      ignorePatterns: [
        { pattern: '**/*.d.ts', reason: 'TypeScript declaration files' },
        { pattern: '**/node_modules/**', reason: 'Dependencies' },
        { pattern: '**/dist/**', reason: 'Build output' }
      ],
      additionalChecks: [
        'TypeScript type safety',
        'Interface and type definitions',
        'Generic type usage'
      ]
    },
    javascript: {
      fileExtensions: ['js', 'jsx'],
      maxFileSize: 1000000,
      ignorePatterns: [
        { pattern: '**/node_modules/**', reason: 'Dependencies' },
        { pattern: '**/dist/**', reason: 'Build output' }
      ],
      additionalChecks: [
        'ESLint compliance',
        'Modern JavaScript features',
        'Async/await patterns'
      ]
    },
    python: {
      fileExtensions: ['py'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/__pycache__/**', reason: 'Python cache files' },
        { pattern: '**/*.pyc', reason: 'Python compiled files' },
        { pattern: '**/venv/**', reason: 'Virtual environment' }
      ],
      additionalChecks: [
        'PEP 8 compliance',
        'Type hints',
        'Docstring coverage'
      ]
    },
    java: {
      fileExtensions: ['java'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/target/**', reason: 'Build output' },
        { pattern: '**/*.class', reason: 'Compiled files' }
      ],
      additionalChecks: [
        'Java coding standards',
        'Exception handling',
        'Design patterns'
      ]
    }
  },
  globalIgnorePatterns: [
    { pattern: '**/.git/**', reason: 'Git repository' },
    { pattern: '**/.github/**', reason: 'GitHub configuration' },
    { pattern: '**/coverage/**', reason: 'Test coverage reports' },
    { pattern: '**/*.min.*', reason: 'Minified files' },
    { pattern: '**/*.map', reason: 'Source maps' }
  ],
  defaultMaxFileSize: 1000000,
  defaultPrompt: `Act as a senior software engineer with deep expertise in {language}. Review the following code changes and provide detailed feedback.

Focus on these critical aspects:
1. Security vulnerabilities and best practices
2. Performance implications and optimizations
3. Code maintainability and readability
4. Potential edge cases and error handling
5. Language-specific best practices
6. Project-specific concerns

{additionalChecks}

Format your response as a JSON object where:
- Keys are line numbers
- Values are objects containing:
  - "suggestion": Clear, actionable improvement suggestion
  - "reason": Detailed explanation of why this change is important

Only include substantive feedback that would meaningfully improve the code. Avoid trivial stylistic comments.

Code to review:
\`\`\`{language}
{code}
\`\`\``,
  defaultChecks: [
    'Code organization',
    'Error handling',
    'Documentation',
    'Testing considerations'
  ]
}; 