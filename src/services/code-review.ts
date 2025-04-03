import { GitHubContext, PullRequestStats } from '../types';
import { GitHubService } from './github';
import { OpenAIService } from './openai';
import { ConfigService } from './config';

export class CodeReviewService {
  constructor(
    private readonly githubService: GitHubService,
    private readonly openAIService: OpenAIService,
    private readonly configService: ConfigService
  ) {}

  async reviewPullRequest(context: GitHubContext): Promise<void> {
    try {
      const { data: files } = await this.githubService.getPullRequestFiles(context);
      const reviewErrors: string[] = [];

      // Post PR summary
      const stats = this.githubService.calculatePullRequestStats(files);
      const summary = this.githubService.generateSummary(stats, files);
      await this.githubService.createComment(context, summary);

      // Prioritize files based on critical keywords and change volume
      const prioritizedFiles = files.sort((a, b) => {
        const criticalPatterns = ['config', 'auth', 'security', '.env'];
        const isCritical = (filename: string) => criticalPatterns.some(pattern => filename.includes(pattern));
        const aCritical = isCritical(a.filename) ? 1 : 0;
        const bCritical = isCritical(b.filename) ? 1 : 0;
        if (aCritical !== bCritical) return bCritical - aCritical;
        return b.changes - a.changes;
      });

      const batchSize = 5;
      for (let i = 0; i < prioritizedFiles.length; i += batchSize) {
        const batchedFiles = prioritizedFiles.slice(i, i + batchSize);

        // Use a Map to store each file's decoded content by filename.
        const fileContents = new Map<string, string>();
        await Promise.all(
          batchedFiles.map(async file => {
            try {
              const { data } = await this.githubService.getFileContent(context, file.filename, file.sha);
              if (!('content' in data)) throw new Error('No content available');
              const decodedContent = Buffer.from(data.content, 'base64').toString();
              fileContents.set(file.filename, decodedContent);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              reviewErrors.push(`Error fetching content for ${file.filename}: ${errorMessage}`);
            }
          })
        );

        // If no valid contents, skip this batch.
        const combinedContent = Array.from(fileContents.values()).join('\n\n');
        if (!combinedContent) continue;

        // Group the batched files by language.
        const groups = new Map<string, { files: typeof batchedFiles; fileContents: Map<string, string> }>();
        for (const file of batchedFiles) {
          const lang = this.configService.detectLanguage(file.filename) || 'unknown';
          if (!groups.has(lang)) {
            groups.set(lang, { files: [], fileContents: new Map<string, string>() });
          }
          groups.get(lang)!.files.push(file);
          const content = fileContents.get(file.filename);
          if (content) {
            groups.get(lang)!.fileContents.set(file.filename, content);
          }
        }

        // For each language group, perform OpenAI review separately.
        for (const [lang, group] of groups.entries()) {
          const combinedContentForLang = Array.from(group.fileContents.entries())
            .map(([filename, content]) => `### ${filename}\n${content}`)
            .join('\n\n');
          if (!combinedContentForLang) continue;
          const review = await this.openAIService.reviewCode(
            combinedContentForLang,
            this.configService.getReviewPrompt(lang, combinedContentForLang)
          );

          // Generate and post a batch summary for the current language group.
          const batchSummary = group.files
            .map(file => {
              const stats = {
                totalFiles: 1,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
              };
              return this.githubService.generateSummary(stats, [file]);
            })
            .join('\n\n');
          await this.githubService.createComment(context, batchSummary);

          // Post individual review comments for each file in the group.
          for (const file of group.files) {
            const fileContent = group.fileContents.get(file.filename);
            if (!fileContent) continue;
            const reviewComment = this.githubService.generateReviewComment(file, review, fileContent);
            await this.githubService.createComment(context, reviewComment);
          }
        }
      }

      // Post errors if any were encountered
      if (reviewErrors.length > 0) {
        const errorComment = `## ⚠️ Review Errors\n\n${reviewErrors.map(error => `- ${error}`).join('\n')}`;
        await this.githubService.createComment(context, errorComment);
      }
    } catch (error) {
      throw error;
    }
  }
}
