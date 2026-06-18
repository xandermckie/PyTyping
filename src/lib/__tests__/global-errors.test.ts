import { describe, expect, it } from 'vitest';
import { _sanitizeReasonForTests } from '../global-errors';

describe('sanitizeReason', () => {
  it('uses Error message without stack', () => {
    const err = new Error('Storage quota exceeded');
    expect(_sanitizeReasonForTests(err)).toBe('Storage quota exceeded');
  });

  it('truncates long strings', () => {
    const long = 'x'.repeat(300);
    expect(_sanitizeReasonForTests(long).length).toBe(200);
  });

  it('handles unknown values', () => {
    expect(_sanitizeReasonForTests(null)).toBe('Unknown error');
  });
});
