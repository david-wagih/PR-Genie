import { GitHubContext, PullRequestStats, PullRequestFile } from '../types';
import { GitHubService } from './github';
import { OpenAIService } from './openai';
import { ConfigService } from './config';
import { ValidationError, PRGenieError } from '../core/errors';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG_FILE_PATH } from '../config/config';

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
      
      // Check if custom review standards file exists
      await this.loadCustomConfigIfExists(context);

      // Apply filtering to exclude files that shouldn't be reviewed
      const filesToReview = this.filterFiles(files);
      
      if (filesToReview.length === 0) {
        await this.githubService.createComment(context, 
          "## 🧞 PR Genie\nNo reviewable files found in this PR after applying filters.");
        return;
      }

      // Prioritize files based on critical keywords and change volume
      const prioritizedFiles = this.prioritizeFiles(filesToReview);

      // For large PRs, limit to the most important files
      const MAX_FILES = 30; // Maximum number of files to review in a large PR
      const isLargePR = prioritizedFiles.length > MAX_FILES;
      const filesToProcess = isLargePR ? prioritizedFiles.slice(0, MAX_FILES) : prioritizedFiles;
      
      // Process files in parallel batches
      const batchSize = 3; // Smaller batch size for better parallelization
      const batchPromises = [];
      
      for (let i = 0; i < filesToProcess.length; i += batchSize) {
        const batchedFiles = filesToProcess.slice(i, i + batchSize);
        batchPromises.push(this.processBatch(batchedFiles, context, reviewErrors));
      }
      
      // Wait for all batches to complete
      await Promise.all(batchPromises);

      // Post a review summary at the end
      let reviewSummary = this.openAIService.generateReviewSummary(reviewErrors);
      
      // Add note about large PR if applicable
      if (isLargePR) {
        reviewSummary += `\n\n> ⚠️ **Note**: This PR contains ${prioritizedFiles.length} files. For efficiency, only the ${MAX_FILES} most important files were reviewed. Consider breaking large PRs into smaller, focused changes.`;
      }
      
      await this.githubService.createComment(context, reviewSummary);
      
    } catch (error) {
      if (error instanceof PRGenieError) {
        throw error;
      } else {
        throw new PRGenieError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          'REVIEW_ERROR'
        );
      }
    }
  }
  
  private filterFiles(files: PullRequestFile[]): PullRequestFile[] {
    return files.filter(file => {
      // Skip files that should be ignored based on config
      if (this.configService.shouldIgnoreFile(file.filename)) {
        return false;
      }
      
      // Skip files that are too large
      const maxSize = this.configService.getMaxFileSize(file.filename);
      if (file.changes > maxSize) {
        return false;
      }
      
      // Skip binary files, images, etc.
      const ext = file.filename.split('.').pop()?.toLowerCase() || '';
      const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'ttf', 'eot', 'zip', 'tar', 'gz', 'binary'];
      if (binaryExtensions.includes(ext)) {
        return false;
      }
      
      return true;
    });
  }
  
  private prioritizeFiles(files: PullRequestFile[]): PullRequestFile[] {
    return files.sort((a, b) => {
      // First prioritize by critical nature (security, config, etc.)
      const criticalPatterns = ['config', 'auth', 'security', '.env', 'password', 'credential', 'token'];
      const isCritical = (filename: string) => criticalPatterns.some(pattern => filename.includes(pattern));
      const aCritical = isCritical(a.filename) ? 1 : 0;
      const bCritical = isCritical(b.filename) ? 1 : 0;
      if (aCritical !== bCritical) return bCritical - aCritical;
      
      // Then prioritize by change magnitude
      return b.changes - a.changes;
    });
  }
  
  private async processBatch(
    batchedFiles: PullRequestFile[], 
    context: GitHubContext, 
    reviewErrors: string[]
  ): Promise<void> {
    try {
      // Use a Map to store each file's decoded content by filename
      const fileContents = new Map<string, string>();
      
      // Fetch all file contents in parallel
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
      
      // If no valid contents, skip this batch
      if (fileContents.size === 0) return;
      
      // Group the batched files by language
      const languageGroups = this.groupFilesByLanguage(batchedFiles, fileContents);
      
      // Process each language group in parallel
      await Promise.all(
        Array.from(languageGroups.entries()).map(async ([lang, group]) => {
          // Skip if no valid content
          if (group.files.length === 0 || group.fileContents.size === 0) return;
          
          try {
            // Combine content for this language group
            const combinedContentForLang = this.combineFileContents(group.fileContents);
            
            // Get review from OpenAI
            const review = await this.openAIService.reviewCode(
              combinedContentForLang,
              this.configService.getReviewPrompt(lang, combinedContentForLang)
            );
            
            // Post individual review comments for each file in the group
            await Promise.all(
              group.files.map(async file => {
                const fileContent = group.fileContents.get(file.filename);
                if (!fileContent) return;
                
                // Generate a focused review comment
                const reviewComment = this.githubService.generateReviewComment(file, review, fileContent);
                
                // Only post if there's actual review content
                if (reviewComment.trim() !== '' && reviewComment.length > 150) {
                  await this.githubService.createComment(context, reviewComment);
                }
              })
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const fileNames = group.files.map(f => f.filename).join(', ');
            reviewErrors.push(`Error reviewing ${lang} files (${fileNames}): ${errorMessage}`);
          }
        })
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      reviewErrors.push(`Error processing batch: ${errorMessage}`);
    }
  }
  
  private groupFilesByLanguage(
    files: PullRequestFile[], 
    fileContents: Map<string, string>
  ): Map<string, { files: PullRequestFile[]; fileContents: Map<string, string> }> {
    const groups = new Map<string, { files: PullRequestFile[]; fileContents: Map<string, string> }>();
    
    for (const file of files) {
      const content = fileContents.get(file.filename);
      if (!content) continue;
      
      const lang = this.configService.detectLanguage(file.filename) || 'unknown';
      if (!groups.has(lang)) {
        groups.set(lang, { files: [], fileContents: new Map<string, string>() });
      }
      
      groups.get(lang)!.files.push(file);
      groups.get(lang)!.fileContents.set(file.filename, content);
    }
    
    return groups;
  }
  
  private combineFileContents(fileContents: Map<string, string>): string {
    return Array.from(fileContents.entries())
      .map(([filename, content]) => {
        // Truncate very large files to 5000 lines
        let truncatedContent = content;
        const MAX_LINES = 5000;
        const lines = content.split('\n');
        
        if (lines.length > MAX_LINES) {
          truncatedContent = lines.slice(0, MAX_LINES).join('\n') + 
            `\n\n// [Content truncated: ${lines.length - MAX_LINES} additional lines not shown]`;
        }
        
        return `### ${filename}\n${truncatedContent}`;
      })
      .join('\n\n');
  }
  
  private async loadCustomConfigIfExists(context: GitHubContext): Promise<void> {
    try {
      const { data } = await this.githubService.getFileContent(
        context, 
        CONFIG_FILE_PATH,
        'HEAD'
      );
      
      if ('content' in data) {
        const configContent = Buffer.from(data.content, 'base64').toString();
        const customConfig = JSON.parse(configContent);
        
        // Create a new config service with the custom config
        const newConfigService = new ConfigService(customConfig);
        
        // Update the current config service
        Object.assign(this.configService, newConfigService);
      }
    } catch (error) {
      // Config file doesn't exist or can't be parsed - use defaults
      return;
    }
  }
}