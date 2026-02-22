import { describe, it, expect } from 'vitest';
import { sanitizeText } from '@/lib/sanitize';

describe('sanitizeText', () => {
  // Basic HTML tag stripping
  it('strips simple script tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('strips nested/malformed script tags', () => {
    // <scr<script>ipt> — the inner <script> tag is stripped, leaving text fragments
    const result = sanitizeText(
      '<scr<script>ipt>alert("xss")</scr</script>ipt>'
    );
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
    expect(result).toContain('alert("xss")');
  });

  it('strips multiple different tags', () => {
    expect(sanitizeText('<div>Hello <b>world</b></div>')).toBe('Hello world');
  });

  it('strips self-closing tags', () => {
    expect(sanitizeText('Hello<br/>World<img src="x"/>')).toBe('HelloWorld');
  });

  it('strips tags with event handler attributes', () => {
    expect(sanitizeText('<img onerror="alert(1)" src="x">')).toBe('');
    expect(sanitizeText('<div onclick="steal()">Click</div>')).toBe('Click');
  });

  // HTML entity handling
  it('decodes and strips HTML entities that form tags', () => {
    expect(sanitizeText('&lt;script&gt;alert("xss")&lt;/script&gt;')).toBe(
      'alert("xss")'
    );
  });

  it('decodes numeric HTML entities', () => {
    expect(sanitizeText('&#60;script&#62;alert(1)&#60;/script&#62;')).toBe(
      'alert(1)'
    );
  });

  it('decodes hex HTML entities', () => {
    expect(sanitizeText('&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;')).toBe(
      'alert(1)'
    );
  });

  it('preserves ampersands in normal text', () => {
    expect(sanitizeText('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  // Null bytes
  it('removes null bytes', () => {
    expect(sanitizeText('Hello\0World')).toBe('HelloWorld');
  });

  it('removes null bytes within tags', () => {
    expect(sanitizeText('<scr\0ipt>alert(1)</scr\0ipt>')).toBe('alert(1)');
  });

  // Whitespace handling
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  Hello World  ')).toBe('Hello World');
  });

  // Preservation of normal text
  it('preserves normal text without HTML', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World');
  });

  it('preserves text with special characters', () => {
    expect(sanitizeText("Pasta & Sauce: Chef's Special")).toBe(
      "Pasta & Sauce: Chef's Special"
    );
  });

  it('preserves numbers', () => {
    expect(sanitizeText('2 cups flour, 350°F')).toBe('2 cups flour, 350°F');
  });

  it('preserves unicode characters', () => {
    expect(sanitizeText('Crème brûlée 🍮')).toBe('Crème brûlée 🍮');
  });

  // Edge cases
  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('handles string with only whitespace', () => {
    expect(sanitizeText('   ')).toBe('');
  });

  it('handles unclosed tags', () => {
    expect(sanitizeText('<div>Hello')).toBe('Hello');
  });

  it('handles very long strings', () => {
    const long = 'A'.repeat(10000);
    expect(sanitizeText(long)).toBe(long);
  });

  it('handles double-encoded entities', () => {
    // &amp;lt; decodes to &lt; which decodes to <
    // Our function decodes once, then strips tags after second decode
    const result = sanitizeText('&amp;lt;script&amp;gt;');
    expect(result).not.toContain('<script>');
  });
});
