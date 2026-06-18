import { describe, expect, it } from 'vitest';
import { describeTypingChar } from '../a11y-text';

describe('describeTypingChar', () => {
  it('labels special characters for screen readers', () => {
    expect(describeTypingChar(' ')).toBe('space');
    expect(describeTypingChar('\n')).toBe('line break');
    expect(describeTypingChar('\t')).toBe('tab');
    expect(describeTypingChar('x')).toBe('x');
  });
});
