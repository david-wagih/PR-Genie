"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const retry_1 = require("../utils/retry");
const constants_1 = require("../constants");
class GitHubService {
    octokit;
    constructor(octokit) {
        this.octokit = octokit;
    }
    async getPullRequest(context) {
        return (0, retry_1.withRetry)(() => this.octokit.rest.pulls.get({
            owner: context.owner,
            repo: context.repo,
            pull_number: context.pullNumber,
        }), {
            maxAttempts: constants_1.DEFAULT_CONFIG.maxRetries,
            delayMs: constants_1.DEFAULT_CONFIG.retryDelay,
            backoffFactor: constants_1.DEFAULT_CONFIG.backoffFactor,
        });
    }
    async getPullRequestFiles(context) {
        return (0, retry_1.withRetry)(() => this.octokit.rest.pulls.listFiles({
            owner: context.owner,
            repo: context.repo,
            pull_number: context.pullNumber,
        }), {
            maxAttempts: constants_1.DEFAULT_CONFIG.maxRetries,
            delayMs: constants_1.DEFAULT_CONFIG.retryDelay,
            backoffFactor: constants_1.DEFAULT_CONFIG.backoffFactor,
        });
    }
    async getFileContent(context, path, sha) {
        return (0, retry_1.withRetry)(() => this.octokit.rest.repos.getContent({
            owner: context.owner,
            repo: context.repo,
            path,
            ref: sha,
        }), {
            maxAttempts: constants_1.DEFAULT_CONFIG.maxRetries,
            delayMs: constants_1.DEFAULT_CONFIG.retryDelay,
            backoffFactor: constants_1.DEFAULT_CONFIG.backoffFactor,
        });
    }
    async createReviewComment(context, params) {
        return (0, retry_1.withRetry)(() => this.octokit.rest.pulls.createReviewComment({
            owner: context.owner,
            repo: context.repo,
            pull_number: context.pullNumber,
            ...params,
        }), {
            maxAttempts: constants_1.DEFAULT_CONFIG.maxRetries,
            delayMs: constants_1.DEFAULT_CONFIG.retryDelay,
            backoffFactor: constants_1.DEFAULT_CONFIG.backoffFactor,
        });
    }
    async createComment(context, body) {
        return (0, retry_1.withRetry)(() => this.octokit.rest.issues.createComment({
            owner: context.owner,
            repo: context.repo,
            issue_number: context.pullNumber,
            body,
        }), {
            maxAttempts: constants_1.DEFAULT_CONFIG.maxRetries,
            delayMs: constants_1.DEFAULT_CONFIG.retryDelay,
            backoffFactor: constants_1.DEFAULT_CONFIG.backoffFactor,
        });
    }
    calculatePullRequestStats(files) {
        return files.reduce((stats, file) => ({
            totalFiles: stats.totalFiles + 1,
            additions: stats.additions + file.additions,
            deletions: stats.deletions + file.deletions,
            changes: stats.changes + file.changes,
        }), { totalFiles: 0, additions: 0, deletions: 0, changes: 0 });
    }
    generateSummary(stats, files) {
        return `# 📊 Pull Request Analysis

## Overview
- 📁 Files changed: ${stats.totalFiles}
- ✨ Lines added: ${stats.additions}
- 🗑️ Lines removed: ${stats.deletions}
- 📈 Total changes: ${stats.changes}

## PR Review

### ⏱️ Estimated effort to review [1-5]
${this.estimateReviewEffort(stats)}
${this.explainReviewEffort(stats, files)}

### 🧪 Relevant tests
${this.checkRelevantTests(files)}

### 🔍 Possible issues
${this.identifyPossibleIssues(files)}

### 🔒 Security concerns
${this.identifySecurityConcerns(files)}

## Files Changed
${this.generateFileChanges(files)}`;
    }
    estimateReviewEffort(stats) {
        const score = Math.min(5, Math.ceil((stats.changes / 100) + (stats.totalFiles / 3)));
        return `${score}`;
    }
    explainReviewEffort(stats, files) {
        const reasons = [];
        if (stats.changes > 200) {
            reasons.push("large number of changes");
        }
        if (stats.totalFiles > 5) {
            reasons.push("multiple files affected");
        }
        if (files.some(f => f.filename.includes('config') || f.filename.endsWith('.json') || f.filename.endsWith('.yml'))) {
            reasons.push("configuration changes require careful review");
        }
        if (files.some(f => f.changes > 100)) {
            reasons.push("contains large file changes");
        }
        if (reasons.length === 0) {
            return "because the changes are straightforward and well-contained.";
        }
        return `because of ${reasons.join(", ")}.`;
    }
    checkRelevantTests(files) {
        const testFiles = files.filter(f => f.filename.includes('test') ||
            f.filename.includes('spec') ||
            f.filename.endsWith('.test.ts') ||
            f.filename.endsWith('.spec.ts'));
        if (testFiles.length === 0) {
            return "No test files were modified. Consider adding tests for the changes.";
        }
        return `Yes - ${testFiles.map(f => f.filename).join(', ')}`;
    }
    identifyPossibleIssues(files) {
        const issues = [];
        // Check for large files without tests
        if (files.some(f => f.changes > 100) && !files.some(f => f.filename.includes('test'))) {
            issues.push("Large code changes without corresponding test updates");
        }
        // Check for configuration changes
        if (files.some(f => f.filename.includes('config'))) {
            issues.push("Configuration changes may impact environment behavior");
        }
        // Check for dependency changes
        if (files.some(f => f.filename.includes('package.json'))) {
            issues.push("Dependency changes may introduce compatibility issues");
        }
        // Check for type definition changes
        if (files.some(f => f.filename.endsWith('.d.ts'))) {
            issues.push("Type definition changes may affect dependent code");
        }
        return issues.length > 0 ? issues.join('\n') : "No significant issues identified";
    }
    identifySecurityConcerns(files) {
        const concerns = [];
        // Check for security-sensitive files
        if (files.some(f => f.filename.includes('auth') ||
            f.filename.includes('security') ||
            f.filename.includes('password') ||
            f.filename.includes('token') ||
            f.filename.includes('secret'))) {
            concerns.push("Changes to security-sensitive components");
        }
        // Check for configuration files that might contain secrets
        if (files.some(f => f.filename.endsWith('.env') ||
            f.filename.includes('config') && (f.filename.endsWith('.json') || f.filename.endsWith('.yml')))) {
            concerns.push("Modified configuration files - verify no secrets are exposed");
        }
        return concerns.length > 0 ? concerns.join('\n') : "No immediate security concerns identified";
    }
    generateFileChanges(files) {
        return files.map(file => {
            const changeType = this.getChangeType(file);
            return `- ${file.filename} (+${file.additions}/-${file.deletions})`;
        }).join('\n');
    }
    calculateComplexityScore(stats) {
        const score = Math.min(10, Math.ceil((stats.changes / 100) + (stats.totalFiles / 3)));
        return `${score}/10`;
    }
    determineReviewPriority(stats) {
        if (stats.changes > 500 || stats.totalFiles > 10)
            return '🔴 High';
        if (stats.changes > 200 || stats.totalFiles > 5)
            return '🟡 Medium';
        return '🟢 Low';
    }
    generateChangesAnalysis(files) {
        const fileTypes = new Map();
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
    generateKeyPoints(files) {
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
    generateDetailedChanges(files) {
        return files.map(file => {
            const changeType = this.getChangeType(file);
            const impact = this.assessFileImpact(file);
            return `### ${file.filename}\n- Type: ${changeType}\n- Impact: ${impact}\n- Changes: +${file.additions}/-${file.deletions}`;
        }).join('\n\n');
    }
    getChangeType(file) {
        if (file.status === 'added')
            return '✨ New File';
        if (file.status === 'removed')
            return '🗑️ Deleted';
        if (file.status === 'renamed')
            return '📝 Renamed';
        return '📝 Modified';
    }
    assessFileImpact(file) {
        const totalChanges = file.additions + file.deletions;
        if (totalChanges > 100)
            return '🔴 High';
        if (totalChanges > 50)
            return '🟡 Medium';
        return '🟢 Low';
    }
    generateNextSteps(stats, files) {
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
    getCodeContext(content, lineNumber, contextLines = 3) {
        const lines = content.split('\n');
        const start = Math.max(0, lineNumber - contextLines - 1);
        const end = Math.min(lines.length, lineNumber + contextLines);
        const relevantLines = lines.slice(start, end);
        const lineNumbers = Array.from({ length: end - start }, (_, i) => start + i + 1);
        return relevantLines
            .map((line, i) => `${lineNumbers[i].toString().padStart(3, ' ')} | ${line}`)
            .join('\n');
    }
    formatReviewSection(title, comments, fileContent) {
        if (!comments?.length)
            return '';
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
    generateReviewComment(file, review, fileContent) {
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
    calculateFileStats(file) {
        return `- Changes: ${file.changes} lines (${file.additions} additions, ${file.deletions} deletions)`;
    }
}
exports.GitHubService = GitHubService;
