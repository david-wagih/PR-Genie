"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const errors_1 = require("../core/errors");
const retry_1 = require("../utils/retry");
const constants_1 = require("../constants");
const security_1 = require("../utils/security");
class OpenAIService {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async reviewCode(code, prompt) {
        const response = await (0, retry_1.withRetry)(() => fetch(constants_1.API_ENDPOINTS.OPENAI, {
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
        }), {
            maxAttempts: constants_1.DEFAULT_CONFIG.maxRetries,
            delayMs: constants_1.DEFAULT_CONFIG.retryDelay,
            backoffFactor: constants_1.DEFAULT_CONFIG.backoffFactor,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new errors_1.OpenAIError(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }
        const data = await response.json();
        try {
            const review = JSON.parse(data.choices[0].message.content);
            return this.formatReviewFeedback(review);
        }
        catch (e) {
            console.error('Failed to parse review response:', e);
            return {};
        }
    }
    formatReviewFeedback(review) {
        const feedback = {};
        // Convert security concerns
        if (review.securityConcerns?.length > 0) {
            feedback.security = review.securityConcerns.map(concern => ({
                suggestion: concern.title,
                reason: concern.description,
                lineNumber: concern.lineNumbers[0] || 1,
                context: concern.suggestion
            }));
        }
        // Convert possible issues
        if (review.possibleIssues?.length > 0) {
            feedback.issues = review.possibleIssues.map(issue => ({
                suggestion: issue.title,
                reason: issue.description,
                lineNumber: issue.lineNumbers[0] || 1,
                context: issue.suggestion
            }));
        }
        // Convert code quality improvements
        if (review.codeQuality?.improvements?.length > 0) {
            feedback.improvements = review.codeQuality.improvements.map(improvement => ({
                suggestion: improvement.title,
                reason: improvement.description,
                lineNumber: improvement.lineNumbers[0] || 1,
                context: improvement.suggestion
            }));
        }
        return feedback;
    }
    generateReviewComment(suggestion, reason) {
        return `📝 **Suggestion**: ${(0, security_1.sanitizeInput)(suggestion)}\n\n💡 **Reason**: ${(0, security_1.sanitizeInput)(reason)}`;
    }
    generateReviewSummary(reviewErrors) {
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
                reviewErrors.map(error => `- ${(0, security_1.sanitizeInput)(error)}`).join('\n');
        }
        return summaryBody;
    }
}
exports.OpenAIService = OpenAIService;
