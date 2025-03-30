"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
exports.isRateLimitError = isRateLimitError;
exports.isNetworkError = isNetworkError;
async function withRetry(operation, options) {
    let lastError = null;
    let delay = options.delayMs;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === options.maxAttempts) {
                break;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for next attempt if backoff is enabled
            if (options.backoffFactor) {
                delay *= options.backoffFactor;
            }
        }
    }
    throw lastError;
}
function isRateLimitError(error) {
    return error?.status === 403 || error?.response?.status === 403;
}
function isNetworkError(error) {
    return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
}
