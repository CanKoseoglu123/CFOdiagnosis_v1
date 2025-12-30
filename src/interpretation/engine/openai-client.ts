/**
 * VS-32: OpenAI Client with Retry Logic
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
}

export async function callOpenAI<T>(
  fn: () => Promise<T>,
  config: RetryConfig = { maxRetries: 2, baseDelayMs: 1000 }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on 4xx except 429
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = config.baseDelayMs * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

export { openai };
