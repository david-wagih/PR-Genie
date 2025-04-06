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
        'Proper error handling',
        'Null/undefined checks'
      ],
    },
    javascript: {
      fileExtensions: ['js', 'jsx'],
      maxFileSize: 1000000,
      ignorePatterns: [
        { pattern: '**/node_modules/**', reason: 'Dependencies' },
        { pattern: '**/dist/**', reason: 'Build output' },
      ],
      additionalChecks: ['Error handling', 'Modern JavaScript features', 'Proper null checks'],
    },
    python: {
      fileExtensions: ['py'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/__pycache__/**', reason: 'Python cache files' },
        { pattern: '**/*.pyc', reason: 'Python compiled files' },
        { pattern: '**/venv/**', reason: 'Virtual environment' },
      ],
      additionalChecks: ['Exception handling', 'Type hints', 'Input validation'],
    },
    java: {
      fileExtensions: ['java'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/target/**', reason: 'Build output' },
        { pattern: '**/*.class', reason: 'Compiled files' },
      ],
      additionalChecks: ['Exception handling', 'Null checks', 'Resource management'],
    },
    go: {
      fileExtensions: ['go'],
      maxFileSize: 2000000,
      ignorePatterns: [
        { pattern: '**/vendor/**', reason: 'Dependencies' },
        { pattern: '**/*.mod', reason: 'Go modules' },
      ],
      additionalChecks: ['Error handling', 'Goroutine safety', 'Proper resource closing'],
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
  defaultPrompt: `You are an expert code reviewer with deep expertise in {language}. Review the following code changes and provide concise, actionable feedback.

Focus ONLY on important issues:
1. Security vulnerabilities
2. Critical performance problems
3. Error handling gaps
4. Logical errors or bugs
5. Maintainability concerns

Return your findings in this JSON format:
{
  "securityConcerns": [
    {
      "title": "Brief issue title",
      "description": "Concise explanation",
      "severity": "high|medium|low",
      "lineNumbers": [number array],
      "suggestion": "Specific fix recommendation"
    }
  ],
  "possibleIssues": [
    {
      "title": "Brief issue title",
      "description": "Concise explanation", 
      "severity": "high|medium|low",
      "lineNumbers": [number array],
      "suggestion": "Specific fix recommendation"
    }
  ],
  "codeQuality": {
    "improvements": [
      {
        "title": "Brief improvement title",
        "description": "Concise explanation",
        "lineNumbers": [number array],
        "suggestion": "Specific implementation suggestion"
      }
    ]
  }
}

Prioritize critical issues over style/cosmetic concerns. Only include problems that actually impact code quality.

Code to review:
\`\`\`{language}
{code}
\`\`\``,
  defaultChecks: ['Error handling', 'Security', 'Resource management', 'Input validation'],
};

// Custom config file path
export const CONFIG_FILE_PATH = '.github/pr-genie-config.json';