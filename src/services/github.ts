import { Octokit } from '@octokit/rest';
import { PullRequestFile, PullRequestStats, GitHubContext, ReviewFeedback, ReviewComment } from '../types';
import { withRetry } from '../utils/retry';
import { DEFAULT_CONFIG } from '../constants';
import { sanitizeInput } from '../utils/security';

export class GitHubService {
  constructor(private readonly octokit: Octokit) {}

  async getPullRequest(context: GitHubContext) {
    return withRetry(
      () => this.octokit.rest.pulls.get({
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
      () => this.octokit.rest.pulls.listFiles({
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
      () => this.octokit.rest.repos.getContent({
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

  async createReviewComment(context: GitHubContext, params: {
    body: string;
    commit_id: string;
    path: string;
    line: number;
  }) {
    return withRetry(
      () => this.octokit.rest.pulls.createReviewComment({
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
      () => this.octokit.rest.issues.createComment({
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
    return files.reduce((stats, file) => ({
      totalFiles: stats.totalFiles + 1,
      additions: stats.additions + file.additions,
      deletions: stats.deletions + file.deletions,
      changes: stats.changes + file.changes,
    }), { totalFiles: 0, additions: 0, deletions: 0, changes: 0 });
  }

  generateSummary(stats: PullRequestStats, files: PullRequestFile[]): string {
    const sections = [];

    // Add PR Overview section
    sections.push(`# 🔍 Pull Request Review

## 📊 Overview
- **Total Changes**: ${stats.changes} lines (${stats.additions} additions, ${stats.deletions} deletions)
- **Files Modified**: ${stats.totalFiles} files
- **Complexity Score**: ${this.calculateComplexityScore(stats)}
- **Review Priority**: ${this.determineReviewPriority(stats)}

## 🔎 Changes Analysis
${this.generateChangesAnalysis(files)}

## 💡 Key Points
${this.generateKeyPoints(files)}

## 📝 Detailed Changes
${this.generateDetailedChanges(files)}

## 🚀 Next Steps
${this.generateNextSteps(stats, files)}
`);

    return sections.join('\n');
  }

  private calculateComplexityScore(stats: PullRequestStats): string {
    const score = Math.min(10, Math.ceil((stats.changes / 100) + (stats.totalFiles / 3)));
    return `${score}/10`;
  }

  private determineReviewPriority(stats: PullRequestStats): string {
    if (stats.changes > 500 || stats.totalFiles > 10) return '🔴 High';
    if (stats.changes > 200 || stats.totalFiles > 5) return '🟡 Medium';
    return '🟢 Low';
  }

  private generateChangesAnalysis(files: PullRequestFile[]): string {
    const fileTypes = new Map<string, number>();
    files.forEach(file => {
      const ext = file.filename.split('.').pop() || 'unknown';
      fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
    });

    const analysis = ['### File Type Distribution'];
    fileTypes.forEach((count, type) => {
      analysis.push(`- ${type.toUpperCase()}: ${count} files`);
    });

    return analysis.join('\n');
  }

  private generateKeyPoints(files: PullRequestFile[]): string {
    const points = [];
    
    // Check for configuration changes
    if (files.some(f => f.filename.includes('config') || f.filename.endsWith('.json') || f.filename.endsWith('.yml'))) {
      points.push('- ⚙️ Contains configuration changes - verify environment impact');
    }

    // Check for test files
    if (files.some(f => f.filename.includes('test'))) {
      points.push('- ✅ Includes test modifications');
    }

    // Check for dependency changes
    if (files.some(f => f.filename.includes('package.json') || f.filename.includes('requirements.txt'))) {
      points.push('- 📦 Dependencies have been modified');
    }

    // Check for documentation updates
    if (files.some(f => f.filename.endsWith('.md') || f.filename.includes('docs'))) {
      points.push('- 📚 Documentation has been updated');
    }

    // Check for large files
    if (files.some(f => f.changes > 100)) {
      points.push('- ⚠️ Contains large file changes (>100 lines)');
    }

    return points.length ? points.join('\n') : '- No significant points to highlight';
  }

  private generateDetailedChanges(files: PullRequestFile[]): string {
    return files.map(file => {
      const changeType = this.getChangeType(file);
      const impact = this.assessFileImpact(file);
      return `### ${file.filename}\n- Type: ${changeType}\n- Impact: ${impact}\n- Changes: +${file.additions}/-${file.deletions}`;
    }).join('\n\n');
  }

  private getChangeType(file: PullRequestFile): string {
    if (file.status === 'added') return '✨ New File';
    if (file.status === 'removed') return '🗑️ Deleted';
    if (file.status === 'renamed') return '📝 Renamed';
    return '📝 Modified';
  }

  private assessFileImpact(file: PullRequestFile): string {
    const totalChanges = file.additions + file.deletions;
    if (totalChanges > 100) return '🔴 High';
    if (totalChanges > 50) return '🟡 Medium';
    return '🟢 Low';
  }

  private generateNextSteps(stats: PullRequestStats, files: PullRequestFile[]): string {
    const steps = [];

    if (stats.changes > 200) {
      steps.push('- Consider breaking down this PR into smaller, more focused changes');
    }

    if (!files.some(f => f.filename.includes('test'))) {
      steps.push('- Add tests to cover the new changes');
    }

    if (files.some(f => f.filename.endsWith('.md'))) {
      steps.push('- Verify documentation accuracy and completeness');
    }

    if (files.some(f => f.changes > 100)) {
      steps.push('- Review large files carefully for potential refactoring opportunities');
    }

    return steps.length ? steps.join('\n') : '- Ready for review';
  }

  private getCodeContext(content: string, lineNumber: number, contextLines: number = 3): string {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    
    const relevantLines = lines.slice(start, end);
    const lineNumbers = Array.from({ length: end - start }, (_, i) => start + i + 1);
    
    return relevantLines
      .map((line: string, i: number) => `${lineNumbers[i].toString().padStart(3, ' ')} | ${line}`)
      .join('\n');
  }

  private formatReviewSection(title: string, comments: ReviewComment[], fileContent: string): string {
    if (!comments?.length) return '';

    const rows = comments.map(comment => {
      const context = this.getCodeContext(fileContent, comment.lineNumber);
      return `| ${comment.suggestion} | \`\`\`${fileContent.split('.')[1]}\n${context}\`\`\` |`;
    }).join('\n');

    return `
### ${title}
| Issue | Context |
|-------|---------|
${rows}`;
  }

  generateReviewComment(file: PullRequestFile, review: ReviewFeedback, fileContent: string): string {
    const sections = [];

    // Add file header with change statistics
    sections.push(`## 📝 Review for \`${file.filename}\` (${file.additions}+/${file.deletions}-)\n`);

    // Add each section with context
    if (review.security?.length) {
      sections.push(this.formatReviewSection('🔒 Security Issues', review.security, fileContent));
    }

    if (review.performance?.length) {
      sections.push(this.formatReviewSection('⚡ Performance Issues', review.performance, fileContent));
    }

    if (review.bestPractices?.length) {
      sections.push(this.formatReviewSection('🎯 Best Practices', review.bestPractices, fileContent));
    }

    if (review.improvements?.length) {
      sections.push(this.formatReviewSection('💡 Suggested Improvements', review.improvements, fileContent));
    }

    if (review.issues?.length) {
      sections.push(this.formatReviewSection('⚠️ Issues Found', review.issues, fileContent));
    }

    return sections.join('\n');
  }

  // New method to calculate file statistics
  calculateFileStats(file: PullRequestFile): string {
    return `- Changes: ${file.changes} lines (${file.additions} additions, ${file.deletions} deletions)`;
  }
} 