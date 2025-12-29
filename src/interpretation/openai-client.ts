/**
 * VS-32a: OpenAI Client with Retry
 *
 * Provides a retry wrapper with exponential backoff for OpenAI API calls.
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

export async function callOpenAIWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (except rate limits)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt),
          config.maxDelayMs
        );
        console.log(`OpenAI call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export { openai };
