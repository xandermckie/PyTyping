import { describe, expect, it } from 'vitest';
import { sanitizeUsername, validateAccounts } from '../auth';
import { AVATAR_COLORS } from '../validation';

const VALID_SALT = 'a'.repeat(32);
const VALID_HASH = 'b'.repeat(64);
const VALID_ID = '550e8400-e29b-41d4-a716-446655440000';

function validAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_ID,
    username: 'alice',
    salt: VALID_SALT,
    hash: VALID_HASH,
    createdAt: '2024-01-01T00:00:00.000Z',
    avatarColor: AVATAR_COLORS[0],
    ...overrides,
  };
}

describe('sanitizeUsername', () => {
  it('strips disallowed characters', () => {
    expect(sanitizeUsername('<script>bob')).toBe('scriptbob');
    expect(sanitizeUsername('hello world!')).toBe('helloworld');
  });

  it('caps length at 20', () => {
    expect(sanitizeUsername('a'.repeat(30)).length).toBe(20);
  });
});

describe('validateAccounts', () => {
  it('accepts a well-formed account', () => {
    const accounts = validateAccounts([validAccount()]);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBe('alice');
    expect(accounts[0].avatarColor).toBe(AVATAR_COLORS[0]);
  });

  it('sanitizes username on import', () => {
    const accounts = validateAccounts([validAccount({ username: '<script>bob' })]);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBe('scriptbob');
  });

  it('rejects username too short after sanitization', () => {
    expect(validateAccounts([validAccount({ username: 'ab' })])).toHaveLength(0);
    expect(validateAccounts([validAccount({ username: '@@' })])).toHaveLength(0);
  });

  it('sanitizes malicious avatarColor', () => {
    const accounts = validateAccounts([
      validAccount({ avatarColor: 'red; background: url(javascript:alert(1))' }),
    ]);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].avatarColor).not.toContain('javascript');
    expect(accounts[0].avatarColor.startsWith('#')).toBe(true);
  });

  it('rejects invalid salt, hash, and id', () => {
    expect(validateAccounts([validAccount({ salt: 'short' })])).toHaveLength(0);
    expect(validateAccounts([validAccount({ hash: 'bad' })])).toHaveLength(0);
    expect(validateAccounts([validAccount({ id: 'not-valid' })])).toHaveLength(0);
  });
});
