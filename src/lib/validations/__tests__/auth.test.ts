import { describe, it, expect } from 'vitest';
import { usernameSchema, usernameFormSchema } from '@/lib/validations/auth';

describe('usernameSchema', () => {
  describe('valid usernames', () => {
    it('accepts a 3-character username (minimum boundary)', () => {
      expect(usernameSchema.safeParse('abc').success).toBe(true);
    });

    it('accepts a 20-character username (maximum boundary)', () => {
      expect(usernameSchema.safeParse('a'.repeat(20)).success).toBe(true);
    });

    it('accepts letters, numbers, and underscores', () => {
      expect(usernameSchema.safeParse('Chef_123').success).toBe(true);
    });

    it('accepts mixed case (case-sensitive)', () => {
      expect(usernameSchema.safeParse('JohnDoe').success).toBe(true);
      expect(usernameSchema.safeParse('johndoe').success).toBe(true);
    });

    it('accepts all-numeric username', () => {
      expect(usernameSchema.safeParse('123').success).toBe(true);
    });

    it('accepts all-underscore username', () => {
      expect(usernameSchema.safeParse('___').success).toBe(true);
    });
  });

  describe('invalid usernames', () => {
    it('rejects empty string', () => {
      expect(usernameSchema.safeParse('').success).toBe(false);
    });

    it('rejects single character (too short)', () => {
      expect(usernameSchema.safeParse('a').success).toBe(false);
    });

    it('rejects 2-character username with correct error message', () => {
      const result = usernameSchema.safeParse('ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Username must be at least 3 characters'
        );
      }
    });

    it('rejects 21-character username with correct error message', () => {
      const result = usernameSchema.safeParse('a'.repeat(21));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Username must be at most 20 characters'
        );
      }
    });

    it('rejects hyphens', () => {
      expect(usernameSchema.safeParse('user-name').success).toBe(false);
    });

    it('rejects spaces', () => {
      const result = usernameSchema.safeParse('user name');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Only letters, numbers, and underscores allowed'
        );
      }
    });

    it('rejects special characters', () => {
      expect(usernameSchema.safeParse('user@name').success).toBe(false);
      expect(usernameSchema.safeParse('user!name').success).toBe(false);
      expect(usernameSchema.safeParse('#user').success).toBe(false);
    });
  });
});

describe('usernameFormSchema', () => {
  it('accepts valid form data', () => {
    const result = usernameFormSchema.safeParse({ username: 'validuser' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('validuser');
    }
  });

  it('rejects missing username field', () => {
    expect(usernameFormSchema.safeParse({}).success).toBe(false);
  });

  it('rejects invalid username in form data', () => {
    expect(usernameFormSchema.safeParse({ username: 'ab' }).success).toBe(
      false
    );
  });
});
