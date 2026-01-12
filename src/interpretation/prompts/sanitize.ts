/**
 * VS-Security: Prompt Input Sanitization
 *
 * Prevents prompt injection attacks by sanitizing user-provided inputs
 * before they are embedded in AI prompts.
 */

/**
 * Maximum lengths for different field types
 */
const MAX_LENGTHS = {
  company_name: 100,
  industry: 100,
  team_size: 50,
  pain_point: 200,
  systems: 200,
  answer: 500,
  default: 200,
} as const;

/**
 * Characters and patterns that could be used for prompt injection
 */
const INJECTION_PATTERNS = [
  // Prompt delimiters that could escape context
  /[═]{3,}/g,                    // Our section delimiters
  /```/g,                        // Code blocks
  /\${.*?}/g,                    // Template literals
  /\{\{.*?\}\}/g,                // Template syntax
  // Instruction override attempts
  /ignore (all |the |previous |above )?instructions/gi,
  /disregard (all |the |previous |above )?instructions/gi,
  /forget (all |the |previous |above )?instructions/gi,
  /new instructions:/gi,
  /system prompt:/gi,
  /you are now/gi,
  /act as/gi,
  /pretend to be/gi,
  // Role manipulation
  /\[system\]/gi,
  /\[user\]/gi,
  /\[assistant\]/gi,
];

/**
 * Sanitizes a single string value for safe prompt embedding
 */
export function sanitizeForPrompt(
  value: string | undefined | null,
  maxLength: number = MAX_LENGTHS.default
): string {
  if (value === undefined || value === null) {
    return '';
  }

  let sanitized = String(value);

  // Apply all injection pattern removals
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Collapse multiple newlines into single
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);

  return sanitized;
}

/**
 * Sanitizes a company name
 */
export function sanitizeCompanyName(name: string | undefined | null): string {
  return sanitizeForPrompt(name, MAX_LENGTHS.company_name);
}

/**
 * Sanitizes an industry value
 */
export function sanitizeIndustry(industry: string | undefined | null): string {
  return sanitizeForPrompt(industry, MAX_LENGTHS.industry);
}

/**
 * Sanitizes team size
 */
export function sanitizeTeamSize(size: string | undefined | null): string {
  return sanitizeForPrompt(size, MAX_LENGTHS.team_size);
}

/**
 * Sanitizes systems description
 */
export function sanitizeSystems(systems: string | undefined | null): string {
  return sanitizeForPrompt(systems, MAX_LENGTHS.systems);
}

/**
 * Sanitizes an array of pain points
 */
export function sanitizePainPoints(painPoints: string[] | undefined | null): string[] {
  if (!painPoints || !Array.isArray(painPoints)) {
    return [];
  }
  return painPoints
    .map(p => sanitizeForPrompt(p, MAX_LENGTHS.pain_point))
    .filter(p => p.length > 0);
}

/**
 * Sanitizes a user's answer to an interpretation question
 */
export function sanitizeAnswer(answer: string | undefined | null): string {
  return sanitizeForPrompt(answer, MAX_LENGTHS.answer);
}

/**
 * Sanitizes an entire GeneratorInput object
 */
export function sanitizeGeneratorInput<T extends {
  company_name: string;
  industry: string;
  team_size?: string;
  pain_points?: string[];
  systems?: string;
}>(input: T): T {
  return {
    ...input,
    company_name: sanitizeCompanyName(input.company_name),
    industry: sanitizeIndustry(input.industry),
    team_size: input.team_size ? sanitizeTeamSize(input.team_size) : undefined,
    pain_points: input.pain_points ? sanitizePainPoints(input.pain_points) : undefined,
    systems: input.systems ? sanitizeSystems(input.systems) : undefined,
  };
}
