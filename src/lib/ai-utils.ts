const ERROR_MESSAGES: Record<string, string> = {
  generate: 'Failed to generate recipe. Please try again.',
  substitute: 'Failed to find substitutions. Please try again.',
  nutrition: 'Failed to estimate nutrition. Please try again.',
  image: 'Failed to generate image. Please try again.',
};

/**
 * Format an AI error into a user-friendly message.
 * @param action - The AI action that failed (e.g. 'generate', 'substitute')
 */
export function formatAIError(action: string): string {
  return ERROR_MESSAGES[action] ?? 'An AI error occurred. Please try again.';
}

/**
 * Retry an async function once on failure.
 * @param fn - The function to execute
 * @param action - The action name for error formatting
 */
export async function withAIRetry<T>(
  fn: () => Promise<T>,
  action: string
): Promise<T> {
  try {
    return await fn();
  } catch {
    // Retry once
    try {
      return await fn();
    } catch {
      throw new Error(formatAIError(action));
    }
  }
}
