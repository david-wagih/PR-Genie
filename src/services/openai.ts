import { ReviewFeedback, OpenAIReviewResponse } from '../types';
import { OpenAIError } from '../core/errors';
import { withRetry } from '../utils/retry';
import { DEFAULT_CONFIG, API_ENDPOINTS } from '../constants';
import { sanitizeInput } from '../utils/security';

export class OpenAIService {
  constructor(private readonly apiKey: string) {}

  async reviewCode(code: string, prompt: string): Promise<ReviewFeedback> {
    const response = await withRetry(
      () =>
        fetch(API_ENDPOINTS.OPENAI, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert code reviewer. Provide clear, actionable feedback focused on security, performance, and best practices.',
              },
              {
                role: 'user',
                content: prompt,
              },
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
      const review = JSON.parse(data.choices[0].message.content) as OpenAIReviewResponse;
      return this.formatReviewFeedback(review);
    } catch (e) {
      console.error('Failed to parse review response:', e);
      // Fallback to an empty review feedback that conforms to the interface
      return {} as ReviewFeedback;
    }
  }

  private formatReviewFeedback(review: OpenAIReviewResponse): ReviewFeedback {
    const feedback: ReviewFeedback = {};

    // Convert security concerns
    if (review.securityConcerns?.length > 0) {
      feedback.security = review.securityConcerns.map(concern => ({
        suggestion: concern.title,
        reason: concern.description,
        lineNumber: concern.lineNumbers[0] || 1,
        context: concern.suggestion,
      }));
    }

    // Convert possible issues
    if (review.possibleIssues?.length > 0) {
      feedback.issues = review.possibleIssues.map(issue => ({
        suggestion: issue.title,
        reason: issue.description,
        lineNumber: issue.lineNumbers[0] || 1,
        context: issue.suggestion,
      }));
    }

    // Convert code quality improvements
    if (review.codeQuality?.improvements?.length > 0) {
      feedback.improvements = review.codeQuality.improvements.map(improvement => ({
        suggestion: improvement.title,
        reason: improvement.description,
        lineNumber: improvement.lineNumbers[0] || 1,
        context: improvement.suggestion,
      }));
    }

    return feedback;
  }

  generateReviewComment(suggestion: string, reason: string): string {
    return `📝 **Suggestion**: ${sanitizeInput(suggestion)}\n\n💡 **Reason**: ${sanitizeInput(reason)}`;
  }

  generateReviewSummary(reviewErrors: string[]): string {
    let summaryBody = [
      '## 🤖 Code Review Complete\n\n',
      "I've reviewed the files in this PR and provided inline comments where I found potential improvements. The review focused on:\n\n",
      '- 🔒 Security best practices\n',
      '- ⚡ Performance optimizations\n',
      '- 📚 Code maintainability\n',
      '- 🎯 Error handling\n',
      '- 📐 Type safety\n',
      '- 🔄 Project-specific concerns\n\n',
      'Please review the inline comments and let me know if you have any questions!',
    ].join('');

    if (reviewErrors.length > 0) {
      summaryBody +=
        '\n\n### ⚠️ Review Errors\n\nSome files could not be reviewed due to errors:\n\n' +
        reviewErrors.map(error => `- ${sanitizeInput(error)}`).join('\n');
    }

    return summaryBody;
  }
}
