export class PRGenieError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PRGenieError';
  }
}

export class GitHubAPIError extends PRGenieError {
  constructor(message: string) {
    super(message, 'GITHUB_API_ERROR');
    this.name = 'GitHubAPIError';
  }
}

export class OpenAIError extends PRGenieError {
  constructor(message: string) {
    super(message, 'OPENAI_ERROR');
    this.name = 'OpenAIError';
  }
}

export class ValidationError extends PRGenieError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class FileProcessingError extends PRGenieError {
  constructor(message: string, public readonly filename: string) {
    super(message, 'FILE_PROCESSING_ERROR');
    this.name = 'FileProcessingError';
  }
}

export class SecurityError extends PRGenieError {
  constructor(message: string) {
    super(message, 'SECURITY_ERROR');
    this.name = 'SecurityError';
  }
} 