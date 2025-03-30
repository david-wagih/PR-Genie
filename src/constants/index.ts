export const REVIEW_PROMPT = `Act as a senior software engineer with deep expertise in TypeScript, Node.js, and GitHub Actions. Review the following code changes and provide detailed feedback.

Focus on these critical aspects:
1. Security vulnerabilities and best practices
2. Performance implications and optimizations
3. Code maintainability and readability
4. Potential edge cases and error handling
5. TypeScript type safety and proper typing
6. GitHub Actions specific concerns and best practices

Format your response as a JSON object where:
- Keys are line numbers
- Values are objects containing:
  - "suggestion": Clear, actionable improvement suggestion
  - "reason": Detailed explanation of why this change is important

Only include substantive feedback that would meaningfully improve the code. Avoid trivial stylistic comments.

Code to review:
\`\`\`typescript
{code}
\`\`\``;

export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1/chat/completions',
} as const;

export const DEFAULT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffFactor: 2,
} as const;

export const ERROR_MESSAGES = {
  RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  INVALID_TOKEN: 'Invalid token format',
  FILE_TOO_LARGE: (size: number) => `File size exceeds maximum allowed size of ${size / 1000}KB`,
  FILE_TYPE_NOT_ALLOWED: (types: string[]) => `File type not allowed. Allowed types: ${types.join(', ')}`,
  INVALID_FILE_SIZE: 'Invalid file size',
  INVALID_FILE_TYPE: 'Invalid file type',
  INVALID_GITHUB_TOKEN: 'Invalid GitHub token format',
  INVALID_OPENAI_TOKEN: 'Invalid OpenAI token format',
  INVALID_PR_NUMBER: 'Invalid PR number',
} as const;
