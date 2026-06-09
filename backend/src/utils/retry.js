/**
 * NALAR retry utility
 * Implements exponential backoff for transient AI/network errors.
 */

/**
 * Determines whether an error is retryable (transient) or fatal (permanent).
 * Fatal errors such as bad requests or auth failures should not be retried.
 */
function isRetryableError(error) {
  const message = (error?.message || '').toLowerCase();
  const status = error?.status || error?.code || error?.httpStatus;

  const fatalPatterns = [
    '400', 'bad request',
    '401', 'unauthorized',
    '403', 'forbidden',
    '404', 'not found',
    'invalid api key',
    'api key not valid',
    'api_key_invalid',
    'permission_denied',
  ];

  for (const pattern of fatalPatterns) {
    if (message.includes(pattern) || String(status) === pattern) {
      return false;
    }
  }

  const retryablePatterns = [
    '408',
    '429',
    '500',
    '502',
    '503',
    '504',
    'service unavailable',
    'overloaded',
    'timeout',
    'timed out',
    'etimedout',
    'econnreset',
    'econnrefused',
    'network error',
    'socket hang up',
    'internal server error',
    'resource_exhausted',
    'unavailable',
  ];

  for (const pattern of retryablePatterns) {
    if (message.includes(pattern) || String(status) === pattern) {
      return true;
    }
  }

  return true;
}

/**
 * Executes an async function with exponential backoff retry logic.
 *
 * @param {Function} fn - The async function to execute.
 * @param {number} retries - Total number of attempts.
 * @param {string} label - Label for log output.
 * @returns {Promise<any>}
 */
export async function withRetry(fn, retries = 4, label = 'AI') {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const result = await fn();

      if (attempt > 1) {
        console.log(`[${label} Retry] Success on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const reason = error?.message || 'Unknown error';

      if (!isRetryableError(error)) {
        console.error(`[${label} Retry] Fatal error on attempt ${attempt}. Not retrying.`);
        console.error(`  Reason: ${reason}`);
        throw error;
      }

      if (attempt === retries) {
        console.error(`[${label} Retry] All ${retries} attempts failed.`);
        console.error(`  Last reason: ${reason}`);
        throw error;
      }

      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[${label} Retry] Attempt ${attempt} failed.`);
      console.warn(`  Reason: ${reason}`);
      console.warn(`  Retrying in ${delayMs}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
