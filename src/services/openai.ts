import { ReviewFeedback } from '../types';
import { OpenAIError } from '../core/errors';
import { withRetry } from '../utils/retry';
import { DEFAULT_CONFIG, API_ENDPOINTS } from '../constants';
import { sanitizeInput } from '../utils/security';

export class OpenAIService {
  constructor(private readonly apiKey: string) {}

  async reviewCode(code: string, prompt: string): Promise<ReviewFeedback> {
    const response = await withRetry(
      () => fetch(API_ENDPOINTS.OPENAI, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer specialized in TypeScript and GitHub Actions. Provide clear, actionable feedback focused on security, performance, and best practices.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
        }),
      }),
      {
        maxAttempts: DEFAULT_CONFIG.maxRetries,
        delayMs: DEFAULT_CONFIG.retryDelay,
        backoffFactor: DEFAULT_CONFIG.backoffFactor,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new OpenAIError(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse review response:', e);
      return {};
    }
  }

  generateReviewComment(suggestion: string, reason: string): string {
    return `📝 **Suggestion**: ${sanitizeInput(suggestion)}\n\n💡 **Reason**: ${sanitizeInput(reason)}`;
  }

  generateReviewSummary(reviewErrors: string[]): string {
    let summaryBody = [
      '## 🤖 Code Review Complete\n\n',
      'I\'ve reviewed the files in this PR and provided inline comments where I found potential improvements. The review focused on:\n\n',
      '- 🔒 Security best practices\n',
      '- ⚡ Performance optimizations\n',
      '- 📚 Code maintainability\n',
      '- 🎯 Error handling\n',
      '- 📐 Type safety\n',
      '- 🔄 Project-specific concerns\n\n',
      'Please review the inline comments and let me know if you have any questions!'
    ].join('');

    if (reviewErrors.length > 0) {
      summaryBody += '\n\n### ⚠️ Review Errors\n\nSome files could not be reviewed due to errors:\n\n' +
        reviewErrors.map(error => `- ${sanitizeInput(error)}`).join('\n');
    }

    return summaryBody;
  }
} 