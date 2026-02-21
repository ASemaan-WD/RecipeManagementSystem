import { describe, it, expect, vi } from 'vitest';
import { withAIRetry, formatAIError } from '@/lib/ai-utils';

describe('formatAIError', () => {
  it('returns specific message for known actions', () => {
    expect(formatAIError('generate')).toContain('generate recipe');
    expect(formatAIError('substitute')).toContain('substitution');
    expect(formatAIError('nutrition')).toContain('nutrition');
    expect(formatAIError('image')).toContain('generate image');
  });

  it('returns generic message for unknown actions', () => {
    expect(formatAIError('unknown')).toContain('AI error');
  });
});

describe('withAIRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withAIRetry(fn, 'generate');
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries once on first failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('retry success');

    const result = await withAIRetry(fn, 'generate');
    expect(result).toBe('retry success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws formatted error after both attempts fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(withAIRetry(fn, 'generate')).rejects.toThrow(
      'Failed to generate recipe'
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
