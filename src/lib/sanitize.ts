/**
 * Server-side HTML sanitization utility for defense-in-depth XSS prevention.
 * React escapes JSX output by default — this provides an additional layer
 * of protection by stripping HTML before database storage.
 */

/**
 * Strip all HTML tags from a string, handling nested and malformed tags.
 * Iteratively removes tags until no more are found to handle constructs
 * like `<scr<script>ipt>`.
 */
function stripHtmlTags(input: string): string {
  let result = input;
  let previous: string;
  do {
    previous = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== previous);
  return result;
}

/**
 * Decode common HTML entities to their text equivalents.
 * Handles named entities and numeric/hex character references.
 */
function decodeHtmlEntities(input: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#47;': '/',
  };

  let result = input;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }

  // Decode numeric entities: &#60; &#x3C; etc.
  result = result.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return result;
}

/**
 * Sanitize user-supplied text by stripping all HTML tags, decoding entities,
 * removing null bytes, and trimming whitespace.
 *
 * @param input - The raw user input string
 * @returns Sanitized plain text safe for database storage
 *
 * @example
 * sanitizeText('<script>alert("xss")</script>Hello')
 * // => 'alert("xss")Hello'
 *
 * sanitizeText('&lt;script&gt;alert("xss")&lt;/script&gt;')
 * // => 'alert("xss")'
 */
export function sanitizeText(input: string): string {
  // 1. Remove null bytes
  let result = input.replace(/\0/g, '');

  // 2. Strip HTML tags (iterative for nested tags)
  result = stripHtmlTags(result);

  // 3. Decode HTML entities (which may reveal encoded tags)
  result = decodeHtmlEntities(result);

  // 4. Strip tags again after entity decoding
  result = stripHtmlTags(result);

  // 5. Trim whitespace
  return result.trim();
}
