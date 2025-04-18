import { Octokit } from '@octokit/rest';
import {
  PullRequestFile,
  PullRequestStats,
  GitHubContext,
  ReviewFeedback,
  ReviewComment,
} from '../types';
import { withRetry } from '../utils/retry';
import { DEFAULT_CONFIG } from '../constants';
import { sanitizeInput } from '../utils/security';

export class GitHubService {
  constructor(private readonly octokit: Octokit) {}

  async getPullRequest(context: GitHubContext) {
    return withRetry(
      () =>
        this.octokit.rest.pulls.get({
          owner: context.owner,
          repo: context.repo,
          pull_number: context.pullNumber,
        }),
      {
        maxAttempts: DEFAULT_CONFIG.maxRetries,
        delayMs: DEFAULT_CONFIG.retryDelay,
        backoffFactor: DEFAULT_CONFIG.backoffFactor,
      }
    );
  }

  async getPullRequestFiles(context: GitHubContext) {
    return withRetry(
      () =>
        this.octokit.rest.pulls.listFiles({
          owner: context.owner,
          repo: context.repo,
          pull_number: context.pullNumber,
        }),
      {
        maxAttempts: DEFAULT_CONFIG.maxRetries,
        delayMs: DEFAULT_CONFIG.retryDelay,
        backoffFactor: DEFAULT_CONFIG.backoffFactor,
      }
    );
  }

  async getFileContent(context: GitHubContext, path: string, sha: string) {
    return withRetry(
      () =>
        this.octokit.rest.repos.getContent({
          owner: context.owner,
          repo: context.repo,
          path,
          ref: sha,
        }),
      {
        maxAttempts: DEFAULT_CONFIG.maxRetries,
        delayMs: DEFAULT_CONFIG.retryDelay,
        backoffFactor: DEFAULT_CONFIG.backoffFactor,
      }
    );
  }

  async createReviewComment(
    context: GitHubContext,
    params: {
      body: string;
      commit_id: string;
      path: string;
      line: number;
    }
  ) {
    return withRetry(
      () =>
        this.octokit.rest.pulls.createReviewComment({
          owner: context.owner,
          repo: context.repo,
          pull_number: context.pullNumber,
          ...params,
        }),
      {
        maxAttempts: DEFAULT_CONFIG.maxRetries,
        delayMs: DEFAULT_CONFIG.retryDelay,
        backoffFactor: DEFAULT_CONFIG.backoffFactor,
      }
    );
  }

  async createComment(context: GitHubContext, body: string) {
    return withRetry(
      () =>
        this.octokit.rest.issues.createComment({
          owner: context.owner,
          repo: context.repo,
          issue_number: context.pullNumber,
          body,
        }),
      {
        maxAttempts: DEFAULT_CONFIG.maxRetries,
        delayMs: DEFAULT_CONFIG.retryDelay,
        backoffFactor: DEFAULT_CONFIG.backoffFactor,
      }
    );
  }

  calculatePullRequestStats(files: PullRequestFile[]): PullRequestStats {
    return files.reduce(
      (stats, file) => ({
        totalFiles: stats.totalFiles + 1,
        additions: stats.additions + file.additions,
        deletions: stats.deletions + file.deletions,
        changes: stats.changes + file.changes,
      }),
      { totalFiles: 0, additions: 0, deletions: 0, changes: 0 }
    );
  }

  generateSummary(stats: PullRequestStats, files: PullRequestFile[]): string {
    return `# 📊 Pull Request Summary

- 📁 Files changed: ${stats.totalFiles}
- ✨ Lines added: ${stats.additions}
- 🗑️ Lines removed: ${stats.deletions}
- 📈 Total changes: ${stats.changes}

### Files Changed
${files.map(file => `- ${file.filename} (+${file.additions}/-${file.deletions})`).join('\n')}
`;
  }

  getCodeContext(content: string, lineNumber: number, contextLines: number = 3): string {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);

    const relevantLines = lines.slice(start, end);
    const lineNumbers = Array.from({ length: end - start }, (_, i) => start + i + 1);

    return relevantLines
      .map((line: string, i: number) => `${lineNumbers[i].toString().padStart(3, ' ')} | ${line}`)
      .join('\n');
  }

  formatReviewSection(title: string, comments: ReviewComment[], fileContent: string): string {
    if (!comments?.length) return '';

    const rows = comments
      .map(comment => {
        const context = this.getCodeContext(fileContent, comment.lineNumber);
        return `### ${comment.suggestion}\n\n**Reason**: ${comment.reason}\n\n\`\`\`\n${context}\n\`\`\`\n`;
      })
      .join('\n');

    return `## ${title}\n${rows}`;
  }

  generateReviewComment(
    file: PullRequestFile,
    review: ReviewFeedback,
    fileContent: string
  ): string {
    const sections = [];

    // Add file header
    sections.push(`# Code Review: \`${file.filename}\``);

    // Add each section with context
    if (review.security?.length) {
      sections.push(this.formatReviewSection('🔒 Security Issues', review.security, fileContent));
    }

    if (review.performance?.length) {
      sections.push(
        this.formatReviewSection('⚡ Performance Issues', review.performance, fileContent)
      );
    }

    if (review.bestPractices?.length) {
      sections.push(
        this.formatReviewSection('🎯 Best Practices', review.bestPractices, fileContent)
      );
    }

    if (review.improvements?.length) {
      sections.push(
        this.formatReviewSection('💡 Suggested Improvements', review.improvements, fileContent)
      );
    }

    if (review.issues?.length) {
      sections.push(this.formatReviewSection('⚠️ Issues Found', review.issues, fileContent));
    }

    // If no issues found, add positive feedback
    if (sections.length === 1) {
      sections.push('✅ No significant issues found in this file.');
    }

    return sections.join('\n\n');
  }
}