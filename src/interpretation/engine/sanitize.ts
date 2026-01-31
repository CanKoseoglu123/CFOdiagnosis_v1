/**
 * Input sanitization for AI prompts.
 * Prevents prompt injection via user-controlled fields.
 */

/**
 * Sanitize user-provided strings before injecting into AI prompts.
 * - Strips control characters
 * - Limits length to 200 chars
 * - Escapes template delimiters
 */
export function sanitizeForPrompt(input: string, maxLength = 200): string {
  if (!input) return '';

  return input
    // Strip control characters (keep newlines and tabs for readability)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Escape template delimiters
    .replace(/\{\{/g, '{ {')
    .replace(/\}\}/g, '} }')
    // Limit length
    .slice(0, maxLength)
    .trim();
}
