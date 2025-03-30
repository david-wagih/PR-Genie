"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const errors_1 = require("./core/errors");
const retry_1 = require("./utils/retry");
const security_1 = require("./utils/security");
const github_1 = require("./services/github");
const openai_1 = require("./services/openai");
const code_review_1 = require("./services/code-review");
const config_1 = require("./services/config");
async function run() {
    try {
        // Get the event context
        const context = github.context;
        // Validate that we're running on a pull request
        if (context.eventName !== 'pull_request') {
            throw new errors_1.ValidationError('This action can only be run on pull request events');
        }
        // Validate pull request number exists
        if (!context.payload.pull_request?.number) {
            throw new errors_1.ValidationError('Pull request number is required');
        }
        // Get and validate inputs
        const inputs = {
            'openai-key': core.getInput('openai-key', { required: true }),
            'config-file': core.getInput('config-file', { required: false })
        };
        // Validate and sanitize tokens
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new errors_1.ValidationError('GitHub token is required');
        }
        (0, security_1.validateGitHubToken)(token);
        const openAIKey = (0, security_1.sanitizeInput)(inputs['openai-key']);
        (0, security_1.validateOpenAIToken)(openAIKey);
        // Create services
        const octokit = github.getOctokit(token);
        const githubService = new github_1.GitHubService(octokit);
        const openAIService = new openai_1.OpenAIService(openAIKey);
        // Load configuration if provided
        let configService;
        if (inputs['config-file']) {
            try {
                const configContent = await githubService.getFileContent({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    pullNumber: context.payload.pull_request.number
                }, inputs['config-file'], context.sha);
                if ('content' in configContent.data) {
                    const config = JSON.parse(Buffer.from(configContent.data.content, 'base64').toString());
                    configService = new config_1.ConfigService(config);
                }
                else {
                    throw new errors_1.ValidationError('Invalid config file format');
                }
            }
            catch (error) {
                console.warn('Failed to load custom config, using defaults:', error);
                configService = new config_1.ConfigService();
            }
        }
        else {
            configService = new config_1.ConfigService();
        }
        const codeReviewService = new code_review_1.CodeReviewService(githubService, openAIService, configService);
        // Create GitHub context
        const githubContext = {
            owner: context.repo.owner,
            repo: context.repo.repo,
            pullNumber: context.payload.pull_request.number
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
    }
    catch (error) {
        if (error instanceof errors_1.PRGenieError) {
            core.setFailed(`[${error.code}] ${error.message}`);
        }
        else if (error instanceof Error) {
            if ((0, retry_1.isRateLimitError)(error)) {
                core.setFailed('Rate limit exceeded. Please try again later.');
            }
            else if ((0, retry_1.isNetworkError)(error)) {
                core.setFailed('Network error occurred. Please check your connection and try again.');
            }
            else {
                core.setFailed(error.message);
            }
        }
        else {
            core.setFailed('An unexpected error occurred');
        }
    }
}
run();
