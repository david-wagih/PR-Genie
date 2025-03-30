import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

export type PullRequestFile = RestEndpointMethodTypes['pulls']['listFiles']['response']['data'][0];

export interface ReviewComment {
  suggestion: string;
  reason: string;
  lineNumber: number;
  context?: string;
}

export interface ReviewFeedback {
  suggestions?: ReviewComment[];
  issues?: ReviewComment[];
  improvements?: ReviewComment[];
  security?: ReviewComment[];
  performance?: ReviewComment[];
  bestPractices?: ReviewComment[];
}

export interface PullRequestStats {
  totalFiles: number;
  additions: number;
  deletions: number;
  changes: number;
}

export interface FilePattern {
  pattern: string;
  reason?: string;
}

export interface LanguageConfig {
  fileExtensions: string[];
  maxFileSize: number;
  ignorePatterns: FilePattern[];
  additionalChecks?: string[];
  customPrompt?: string;
}

export interface ReviewConfig {
  languages: {
    [key: string]: LanguageConfig;
  };
  globalIgnorePatterns: FilePattern[];
  defaultMaxFileSize: number;
  defaultPrompt: string;
  defaultChecks: string[];
}

export interface GitHubContext {
  owner: string;
  repo: string;
  pullNumber: number;
} 