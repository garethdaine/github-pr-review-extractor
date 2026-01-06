// Error handling utilities for GitHub PR Review Extractor

export const ErrorCategory = {
  NETWORK: 'network',
  API: 'api',
  DOM: 'dom',
  LLM: 'llm',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
} as const;

export type ErrorCategoryValue = typeof ErrorCategory[keyof typeof ErrorCategory];

type ErrorLike = {
  name?: string;
  message?: string;
  stack?: string;
};

function toErrorLike(error: unknown): ErrorLike {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null) return error as ErrorLike;
  return { message: String(error) };
}

export function categorizeError(error: unknown): ErrorCategoryValue {
  const err = toErrorLike(error);

  const message = err.message?.toLowerCase() || '';
  const name = err.name?.toLowerCase() || '';

  // Network errors
  if (name === 'networkerror' || name === 'typeerror' && message.includes('network') ||
      message.includes('fetch failed') || message.includes('network error') ||
      message.includes('timeout') || message.includes('connection')) {
    return ErrorCategory.NETWORK;
  }

  // API errors (GitHub API, etc.)
  if (message.includes('api') || message.includes('401') || message.includes('403') ||
      message.includes('404') || message.includes('422') || message.includes('500') ||
      message.includes('rate limit') || message.includes('unauthorized') ||
      message.includes('forbidden')) {
    return ErrorCategory.API;
  }

  // DOM errors
  if (message.includes('queryselector') || message.includes('dom') ||
      message.includes('element') && message.includes('not found') ||
      message.includes('null') && (message.includes('query') || message.includes('select'))) {
    return ErrorCategory.DOM;
  }

  // LLM errors
  if (message.includes('llm') || message.includes('model') ||
      message.includes('openai') || message.includes('ollama') ||
      message.includes('completion')) {
    return ErrorCategory.LLM;
  }

  // Validation errors
  if (message.includes('invalid') || message.includes('required') ||
      message.includes('missing') || message.includes('validation')) {
    return ErrorCategory.VALIDATION;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get user-friendly error message
 * @param {Error} error - The error object
 * @param {string} context - Additional context about where the error occurred
 * @returns {Object} - Object with message and suggestions
 */
export function getErrorMessage(error: unknown, context = ''): {
  category: ErrorCategoryValue;
  message: string;
  originalMessage: string;
  suggestions: string[];
  context: string;
} {
  const err = toErrorLike(error);
  const category = categorizeError(err);
  const message = err.message || 'An unknown error occurred';
  const suggestions: string[] = [];

  let friendlyMessage = message;

  switch (category) {
    case ErrorCategory.NETWORK:
      friendlyMessage = 'Network connection failed.';
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      if (context.includes('LLM') || context.includes('server')) {
        suggestions.push('Verify your LLM server is running and accessible');
      }
      break;

    case ErrorCategory.API:
      if (message.includes('401') || message.includes('unauthorized')) {
        friendlyMessage = 'Authentication failed.';
        suggestions.push('Check your GitHub token in extension settings');
        suggestions.push('Ensure the token has the required permissions');
        suggestions.push('Try regenerating your token');
      } else if (message.includes('403') || message.includes('forbidden')) {
        friendlyMessage = 'Access denied.';
        suggestions.push('Verify you have permission to access this resource');
        suggestions.push('Check if your GitHub token has sufficient scopes');
      } else if (message.includes('404')) {
        friendlyMessage = 'Resource not found.';
        suggestions.push('Verify the PR URL is correct');
        suggestions.push('Ensure the repository and PR exist');
      } else if (message.includes('rate limit')) {
        friendlyMessage = 'API rate limit exceeded.';
        suggestions.push('Wait a few minutes before trying again');
        suggestions.push('Consider using a GitHub token to increase limits');
      } else if (message.includes('422')) {
        friendlyMessage = 'Invalid request.';
        suggestions.push('The data format may be incorrect');
        suggestions.push('Check browser console for details');
      } else {
        friendlyMessage = `API error: ${message}`;
      }
      break;

    case ErrorCategory.DOM:
      friendlyMessage = 'Could not extract data from the page.';
      suggestions.push('Ensure you are on a GitHub PR page');
      suggestions.push('Try refreshing the page');
      suggestions.push('GitHub may have updated their page structure');
      break;

    case ErrorCategory.LLM:
      friendlyMessage = 'AI review generation failed.';
      suggestions.push('Check your LLM server configuration in settings');
      suggestions.push('Verify the LLM server is running and accessible');
      suggestions.push('Test the connection in extension settings');
      suggestions.push('Check server logs for errors');
      break;

    case ErrorCategory.VALIDATION:
      friendlyMessage = `Invalid input: ${message}`;
      suggestions.push('Check that all required fields are filled');
      suggestions.push('Verify the format of your input');
      break;

    default:
      friendlyMessage = `Error: ${message}`;
      suggestions.push('Check browser console for details');
      suggestions.push('Try refreshing and trying again');
  }

  return {
    category,
    message: friendlyMessage,
    originalMessage: message,
    suggestions,
    context
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry (should return a Promise)
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      const category = categorizeError(error);
      if (category === ErrorCategory.VALIDATION || category === ErrorCategory.API &&
          (toErrorLike(error).message?.includes('401') || toErrorLike(error).message?.includes('403') || toErrorLike(error).message?.includes('404'))) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Log error for debugging
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {Object} metadata - Additional metadata
 */
export function logError(error: unknown, context = '', metadata: Record<string, unknown> = {}) {
  const errorInfo = getErrorMessage(error, context);

  console.error('Error:', {
    category: errorInfo.category,
    message: errorInfo.message,
    originalMessage: errorInfo.originalMessage,
    context,
    metadata,
    stack: toErrorLike(error).stack,
    timestamp: new Date().toISOString()
  });

  // Could send to error tracking service here if needed
}

/**
 * Format error for display in UI
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @returns {string} - Formatted error message for UI
 */
export function formatErrorForUI(error: unknown, context = ''): string {
  const errorInfo = getErrorMessage(error, context);
  let message = errorInfo.message;

  if (errorInfo.suggestions.length > 0) {
    message += '\n\n' + errorInfo.suggestions.map(s => `• ${s}`).join('\n');
  }

  return message;
}

// Expose globally for debugging/legacy usage
if (typeof window !== 'undefined') {
  (window as any).errorHandler = {
    categorizeError,
    getErrorMessage,
    retryWithBackoff,
    logError,
    formatErrorForUI,
    ErrorCategory
  };
}
