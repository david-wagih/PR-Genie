export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor?: number;
}

function log(level: 'info' | 'warning' | 'error', message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.delayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === options.maxAttempts) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => {
        log('info', `Retrying operation in ${delay}ms (Attempt ${attempt}/${options.maxAttempts})`);
        setTimeout(resolve, delay);
      });

      // Increase delay for next attempt if backoff is enabled
      if (options.backoffFactor) {
        delay *= options.backoffFactor;
      }
    }
  }

  throw lastError;
}

export function isRateLimitError(error: any): boolean {
  return error?.status === 403 || error?.response?.status === 403;
}

export function isNetworkError(error: any): boolean {
  return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
}
