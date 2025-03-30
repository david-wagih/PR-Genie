"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeReviewService = void 0;
const errors_1 = require("../core/errors");
const security_1 = require("../utils/security");
class CodeReviewService {
    githubService;
    openAIService;
    configService;
    constructor(githubService, openAIService, configService) {
        this.githubService = githubService;
        this.openAIService = openAIService;
        this.configService = configService;
    }
    async reviewPullRequest(context) {
        try {
            // Get the PR diff
            const { data: files } = await this.githubService.getPullRequestFiles(context);
            const reviewErrors = [];
            // First, post the summary
            const stats = this.githubService.calculatePullRequestStats(files);
            const summary = this.githubService.generateSummary(stats, files);
            await this.githubService.createComment(context, summary);
            // Then review each file
            for (const file of files) {
                try {
                    // Check if file should be ignored
                    if (this.configService.shouldIgnoreFile(file.filename)) {
                        console.log(`Skipping ${file.filename}: File matches ignore pattern`);
                        continue;
                    }
                    // Detect language and get configuration
                    const language = this.configService.detectLanguage(file.filename);
                    if (!language) {
                        console.log(`Skipping ${file.filename}: Unsupported file type`);
                        continue;
                    }
                    const languageConfig = this.configService.getLanguageConfig(language);
                    // Validate file type
                    (0, security_1.validateFileType)(file.filename, languageConfig.fileExtensions);
                    // Get the file content
                    const { data } = await this.githubService.getFileContent(context, file.filename, file.sha);
                    // Handle the response which can be a single file or an array
                    if (Array.isArray(data) || !('content' in data)) {
                        console.log(`Skipping ${file.filename}: Not a single file or no content available`);
                        continue;
                    }
                    // Prepare the content for review
                    const fileContent = Buffer.from(data.content, 'base64').toString();
                    // Validate file size
                    const maxFileSize = this.configService.getMaxFileSize(file.filename);
                    (0, security_1.validateFileSize)(fileContent, maxFileSize);
                    // Sanitize code content
                    const sanitizedContent = (0, security_1.sanitizeCodeContent)(fileContent);
                    // Get review from OpenAI with language-specific prompt
                    const review = await this.openAIService.reviewCode(sanitizedContent, this.configService.getReviewPrompt(language, sanitizedContent));
                    // Generate and post the review comment with file content for context
                    const reviewComment = this.githubService.generateReviewComment(file, review, fileContent);
                    await this.githubService.createComment(context, reviewComment);
                }
                catch (error) {
                    if (error instanceof errors_1.FileProcessingError) {
                        reviewErrors.push(`Error processing ${file.filename}: ${error.message}`);
                    }
                    else {
                        reviewErrors.push(`Unexpected error processing ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
            // If there were any errors, post them as a separate comment
            if (reviewErrors.length > 0) {
                const errorComment = `## ⚠️ Review Errors\n\n${reviewErrors.map(error => `- ${error}`).join('\n')}`;
                await this.githubService.createComment(context, errorComment);
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CodeReviewService = CodeReviewService;
