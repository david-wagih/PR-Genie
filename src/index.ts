import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { PRGenieError, ValidationError } from './core/errors';
import { isRateLimitError, isNetworkError } from './utils/retry';
import { validateGitHubToken, validateOpenAIToken, sanitizeInput } from './utils/security';
import { GitHubService } from './services/github';
import { OpenAIService } from './services/openai';
import { CodeReviewService } from './services/code-review';
import { ConfigService } from './services/config';
import { GitHubContext } from './types';

async function run(retryCount = 0): Promise<void> {
  const MAX_RETRIES = 5; // Define a maximum retry limit
  try {
    // Get the event context
    const context = github.context;

    // Validate that we're running on a pull request
    if (context.eventName !== 'pull_request') {
      throw new ValidationError('This action can only be run on pull request events');
    }

    // Validate pull request number exists
    if (!context.payload.pull_request?.number) {
      throw new ValidationError('Pull request number is required');
    }

    // Get and validate inputs
    const inputs = {
      'openai-key': core.getInput('openai-key', { required: true }),
    };

    // Get the GitHub token from the environment
    const token = process.env.GITHUB_TOKEN || core.getInput('GITHUB_TOKEN');
    if (!token) {
      throw new ValidationError('GitHub token is required');
    }
    validateGitHubToken(token);

    const openAIKey = sanitizeInput(inputs['openai-key']);
    validateOpenAIToken(openAIKey);

    // Create services
    const octokit = github.getOctokit(token) as unknown as Octokit;
    const githubService = new GitHubService(octokit);
    const openAIService = new OpenAIService(openAIKey);
    const configService = new ConfigService(); // Using default configuration

    const codeReviewService = new CodeReviewService(githubService, openAIService, configService);

    // Create GitHub context
    const githubContext: GitHubContext = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      pullNumber: context.payload.pull_request.number,
    };

    // Get PR details
    const { data: pr } = await githubService.getPullRequest(githubContext);

    // Get PR files and calculate statistics
    const { data: files } = await githubService.getPullRequestFiles(githubContext);
    const stats = githubService.calculatePullRequestStats(files);

    // Generate and post summary
    const summary = githubService.generateSummary(stats, files);
    await githubService.createComment(githubContext, summary);

    // Perform code review
    await codeReviewService.reviewPullRequest(githubContext);

    // Set outputs
    core.setOutput('total_files', stats.totalFiles);
    core.setOutput('additions', stats.additions);
    core.setOutput('deletions', stats.deletions);
    core.setOutput('total_changes', stats.changes);
  } catch (error) {
    if (error instanceof PRGenieError) {
      core.setFailed(`[${error.code}] ${error.message}`);
    } else if (error instanceof Error) {
      if (isRateLimitError(error)) {
        core.warning('Rate limit exceeded. Retrying...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          core.warning(`Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          await run(retryCount + 1); // Retry with incremented count
        } else {
          core.setFailed('Maximum retry attempts reached. Aborting...');
        }
      } else if (isNetworkError(error)) {
        core.warning('Network error occurred. Retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        await run(); // Retry the action
      } else {
        core.setFailed(error.message);
      }
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
