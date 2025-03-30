"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.validateToken = validateToken;
exports.validateFileSize = validateFileSize;
exports.validateFileType = validateFileType;
exports.sanitizeCodeContent = sanitizeCodeContent;
exports.validateGitHubToken = validateGitHubToken;
exports.validateOpenAIToken = validateOpenAIToken;
const errors_1 = require("../core/errors");
function sanitizeInput(input) {
    // Remove any potential HTML/script injection
    return input.replace(/[<>]/g, '');
}
function validateToken(token) {
    if (!token || token.length < 40) {
        throw new errors_1.SecurityError('Invalid token format');
    }
}
function validateFileSize(content, maxSizeBytes = 1000000) {
    const size = Buffer.byteLength(content, 'utf8');
    if (size > maxSizeBytes) {
        throw new errors_1.SecurityError(`File size exceeds maximum allowed size of ${maxSizeBytes / 1000}KB`);
    }
}
function validateFileType(filename, allowedExtensions) {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
        throw new errors_1.SecurityError(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
    }
}
function sanitizeCodeContent(content) {
    // Remove potential malicious patterns
    return content
        .replace(/eval\s*\(/gi, '') // Remove eval calls
        .replace(/Function\s*\(/gi, '') // Remove Function constructor calls
        .replace(/new\s+Function\s*\(/gi, '') // Remove new Function calls
        .replace(/require\s*\(/gi, '') // Remove require calls
        .replace(/import\s*\(/gi, ''); // Remove dynamic imports
}
function validateGitHubToken(token) {
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        throw new errors_1.SecurityError('Invalid GitHub token format');
    }
}
function validateOpenAIToken(token) {
    if (!token.startsWith('sk-')) {
        throw new errors_1.SecurityError('Invalid OpenAI token format');
    }
}
