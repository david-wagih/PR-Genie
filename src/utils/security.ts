import { SecurityError } from '../core/errors';

export function sanitizeInput(input: string): string {
  // Remove any potential HTML/script injection
  return input.replace(/[<>]/g, '');
}

export function validateToken(token: string): void {
  if (!token || token.length < 40) {
    throw new SecurityError('Invalid token format');
  }
}

export function validateFileSize(content: string, maxSizeBytes: number = 1000000): void {
  const size = Buffer.byteLength(content, 'utf8');
  if (size > maxSizeBytes) {
    throw new SecurityError(`File size exceeds maximum allowed size of ${maxSizeBytes / 1000}KB`);
  }
}

export function validateFileType(filename: string, allowedExtensions: string[]): void {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new SecurityError(
      `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`
    );
  }
}

export function sanitizeCodeContent(content: string): string {
  // Remove potential malicious patterns
  return content
    .replace(/eval\s*\(/gi, '') // Remove eval calls
    .replace(/Function\s*\(/gi, '') // Remove Function constructor calls
    .replace(/new\s+Function\s*\(/gi, '') // Remove new Function calls
    .replace(/require\s*\(/gi, '') // Remove require calls
    .replace(/import\s*\(/gi, ''); // Remove dynamic imports
}

export function validateGitHubToken(token: string): void {
  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_') && !token.startsWith('ghs_')) {
    throw new SecurityError('Invalid GitHub token format');
  }
}

export function validateOpenAIToken(token: string): void {
  if (!token.startsWith('sk-')) {
    throw new SecurityError('Invalid OpenAI token format');
  }
}
