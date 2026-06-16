import { describe, expect, it } from 'vitest';
import {
  AVATAR_COLORS,
  clampNumber,
  isHttpsUrl,
  isValidAccountHash,
  isValidAccountId,
  isValidHexColor,
  isValidHexString,
  pickAvatarColorFromUsername,
  sanitizeAvatarColor,
  sanitizeHexColor,
} from '../validation';

describe('sanitizeHexColor', () => {
  it('accepts valid hex colors', () => {
    expect(sanitizeHexColor('#abc', '#000')).toBe('#abc');
    expect(sanitizeHexColor('#aabbcc', '#000')).toBe('#aabbcc');
  });

  it('rejects CSS injection attempts', () => {
    const fallback = '#111111';
    expect(sanitizeHexColor('red; background: url(javascript:alert(1))', fallback)).toBe(fallback);
    expect(sanitizeHexColor('url(javascript:alert(1))', fallback)).toBe(fallback);
  });
});

describe('sanitizeAvatarColor', () => {
  it('accepts palette colors', () => {
    expect(sanitizeAvatarColor(AVATAR_COLORS[0], '#000')).toBe(AVATAR_COLORS[0]);
  });

  it('falls back for arbitrary CSS', () => {
    const fallback = AVATAR_COLORS[1];
    expect(sanitizeAvatarColor('red; background: url(javascript:alert(1))', fallback)).toBe(fallback);
  });

  it('accepts valid hex outside palette', () => {
    expect(sanitizeAvatarColor('#ff00ff', AVATAR_COLORS[0])).toBe('#ff00ff');
  });
});

describe('pickAvatarColorFromUsername', () => {
  it('returns a palette color', () => {
    const color = pickAvatarColorFromUsername('alice');
    expect((AVATAR_COLORS as readonly string[]).includes(color)).toBe(true);
  });

  it('is stable for the same username', () => {
    expect(pickAvatarColorFromUsername('bob')).toBe(pickAvatarColorFromUsername('bob'));
  });
});

describe('isValidHexString', () => {
  it('validates exact byte length', () => {
    expect(isValidHexString('a'.repeat(32), 16)).toBe(true);
    expect(isValidHexString('a'.repeat(31), 16)).toBe(false);
    expect(isValidHexString('zz'.repeat(16), 16)).toBe(false);
  });
});

describe('isValidAccountId', () => {
  it('accepts UUID and legacy ids', () => {
    expect(isValidAccountId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidAccountId('a_0123456789abcdef')).toBe(true);
  });

  it('rejects malformed ids', () => {
    expect(isValidAccountId('<script>')).toBe(false);
    expect(isValidAccountId('')).toBe(false);
  });
});

describe('isValidAccountHash', () => {
  it('accepts PBKDF2 hex and weak-hash prefix', () => {
    expect(isValidAccountHash('a'.repeat(64))).toBe(true);
    expect(isValidAccountHash('weak$deadbeef')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidAccountHash('not-a-hash')).toBe(false);
    expect(isValidAccountHash('a'.repeat(63))).toBe(false);
  });
});

describe('clampNumber', () => {
  it('clamps to bounds', () => {
    expect(clampNumber(150, 0, 100)).toBe(100);
    expect(clampNumber(-5, 0, 100)).toBe(0);
    expect(clampNumber(50, 0, 100)).toBe(50);
  });
});

describe('isHttpsUrl', () => {
  it('accepts https URLs', () => {
    expect(isHttpsUrl('https://docs.python.org/3/')).toBe(true);
  });

  it('rejects non-https and dangerous schemes', () => {
    expect(isHttpsUrl('http://example.com')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpsUrl('data:text/html,hi')).toBe(false);
  });
});

describe('isValidHexColor', () => {
  it('matches strict hex only', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('white')).toBe(false);
  });
});
