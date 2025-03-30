"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityError = exports.FileProcessingError = exports.ValidationError = exports.OpenAIError = exports.GitHubAPIError = exports.PRGenieError = void 0;
class PRGenieError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'PRGenieError';
    }
}
exports.PRGenieError = PRGenieError;
class GitHubAPIError extends PRGenieError {
    constructor(message) {
        super(message, 'GITHUB_API_ERROR');
        this.name = 'GitHubAPIError';
    }
}
exports.GitHubAPIError = GitHubAPIError;
class OpenAIError extends PRGenieError {
    constructor(message) {
        super(message, 'OPENAI_ERROR');
        this.name = 'OpenAIError';
    }
}
exports.OpenAIError = OpenAIError;
class ValidationError extends PRGenieError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class FileProcessingError extends PRGenieError {
    filename;
    constructor(message, filename) {
        super(message, 'FILE_PROCESSING_ERROR');
        this.filename = filename;
        this.name = 'FileProcessingError';
    }
}
exports.FileProcessingError = FileProcessingError;
class SecurityError extends PRGenieError {
    constructor(message) {
        super(message, 'SECURITY_ERROR');
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
