/**
 * VS-32: Resilience Layer for OpenAI API Calls
 *
 * Provides:
 * - Exponential backoff retry logic
 * - Circuit breaker pattern
 * - Rate limit handling
 * - Timeout management
 */

import OpenAI from 'openai';

// ============================================================
// CONFIGURATION
// ============================================================

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
  retryableErrorCodes: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ESOCKETTIMEDOUT',
    'ECONNREFUSED',
  ],
};

export const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,         // Open circuit after 5 failures
  resetTimeMs: 60000,          // 1 minute before half-open
  halfOpenSuccessThreshold: 2, // Successes needed to close
};

// ============================================================
// TYPES
// ============================================================

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
}

export interface RetryStats {
  attempts: number;
  totalDelayMs: number;
  lastError: string | null;
}

// ============================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================

class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private lastFailure: number | null = null;
  private lastSuccess: number | null = null;
  private state: CircuitState = 'closed';

  getState(): CircuitState {
    // Check if we should move from open to half-open
    if (
      this.state === 'open' &&
      this.lastFailure &&
      Date.now() - this.lastFailure >= CIRCUIT_BREAKER_CONFIG.resetTimeMs
    ) {
      this.state = 'half-open';
      this.successes = 0;
    }
    return this.state;
  }

  isOpen(): boolean {
    return this.getState() === 'open';
  }

  recordSuccess(): void {
    this.lastSuccess = Date.now();
    this.successes++;

    if (this.state === 'half-open') {
      if (this.successes >= CIRCUIT_BREAKER_CONFIG.halfOpenSuccessThreshold) {
        this.state = 'closed';
        this.failures = 0;
        console.log('[CircuitBreaker] Circuit closed after successful recovery');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  recordFailure(error: Error): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.state === 'half-open') {
      // Any failure in half-open immediately opens circuit
      this.state = 'open';
      console.log('[CircuitBreaker] Circuit re-opened after failure in half-open state');
    } else if (this.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      this.state = 'open';
      console.log(`[CircuitBreaker] Circuit opened after ${this.failures} failures`);
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.getState(),
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
    };
  }

  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.lastSuccess = null;
    this.state = 'closed';
  }
}

// Global circuit breaker instance for OpenAI
const openAICircuitBreaker = new CircuitBreaker();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    // Retry on rate limits and server errors
    return RETRY_CONFIG.retryableStatuses.includes(error.status);
  }

  if (error instanceof Error) {
    // Retry on network errors
    const errorCode = (error as NodeJS.ErrnoException).code;
    if (errorCode && RETRY_CONFIG.retryableErrorCodes.includes(errorCode)) {
      return true;
    }

    // Retry on timeout
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return true;
    }
  }

  return false;
}

function calculateDelay(attempt: number, error?: unknown): number {
  let delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);

  // Use Retry-After header if available
  if (error instanceof OpenAI.APIError && error.status === 429) {
    const headers = error.headers as Record<string, string> | undefined;
    const retryAfter = headers?.['retry-after'];
    if (retryAfter) {
      const retryAfterMs = parseInt(retryAfter, 10) * 1000;
      if (!isNaN(retryAfterMs)) {
        delay = Math.max(delay, retryAfterMs);
      }
    }
  }

  // Add jitter (10-30% random variation)
  const jitter = delay * (0.1 + Math.random() * 0.2);
  delay += jitter;

  // Cap at max delay
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// MAIN RETRY WRAPPER
// ============================================================

/**
 * Execute an OpenAI API call with retry logic and circuit breaker protection.
 *
 * @param fn - The async function that makes the OpenAI API call
 * @param context - Description for logging (e.g., "generator_draft")
 * @returns The result of the function call
 * @throws Error if all retries are exhausted or circuit is open
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string = 'openai_call'
): Promise<T> {
  // Check circuit breaker first
  if (openAICircuitBreaker.isOpen()) {
    const stats = openAICircuitBreaker.getStats();
    const waitMs = stats.lastFailure
      ? CIRCUIT_BREAKER_CONFIG.resetTimeMs - (Date.now() - stats.lastFailure)
      : CIRCUIT_BREAKER_CONFIG.resetTimeMs;

    throw new Error(
      `OpenAI circuit breaker is open. ` +
        `Service unavailable after ${stats.failures} failures. ` +
        `Will retry in ${Math.ceil(waitMs / 1000)}s.`
    );
  }

  let lastError: Error | null = null;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await fn();
      openAICircuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log the error
      console.error(
        `[${context}] Attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1} failed:`,
        lastError.message
      );

      // Check if we should retry
      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = calculateDelay(attempt, error);
        totalDelayMs += delay;
        console.log(`[${context}] Retrying in ${Math.ceil(delay / 1000)}s...`);
        await sleep(delay);
      } else {
        // No more retries - record failure and throw
        openAICircuitBreaker.recordFailure(lastError);
        throw lastError;
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Unknown error in retry loop');
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Get current circuit breaker statistics.
 */
export function getCircuitBreakerStats(): CircuitBreakerStats {
  return openAICircuitBreaker.getStats();
}

/**
 * Reset circuit breaker (for testing or manual recovery).
 */
export function resetCircuitBreaker(): void {
  openAICircuitBreaker.reset();
}

/**
 * Check if the circuit is currently allowing requests.
 */
export function isCircuitHealthy(): boolean {
  return !openAICircuitBreaker.isOpen();
}

// ============================================================
// WRAPPED OPENAI CLIENT
// ============================================================

let _openai: OpenAI | null = null;

/**
 * Get a lazily-initialized OpenAI client.
 * Use this instead of creating new clients everywhere.
 */
export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }
  return _openai;
}

/**
 * Create a chat completion with automatic retry and circuit breaker protection.
 *
 * @param params - OpenAI chat completion parameters
 * @param context - Description for logging
 * @returns The chat completion response
 */
export async function createChatCompletionWithRetry(
  params: OpenAI.ChatCompletionCreateParams,
  context: string = 'chat_completion'
): Promise<OpenAI.ChatCompletion> {
  return withRetry(
    () => getOpenAI().chat.completions.create({ ...params, stream: false }) as Promise<OpenAI.ChatCompletion>,
    context
  );
}
