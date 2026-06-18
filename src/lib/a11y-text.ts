/** Human-readable label for a single character in typing announcements. */
export function describeTypingChar(ch: string): string {
  if (ch === ' ') return 'space';
  if (ch === '\n') return 'line break';
  if (ch === '\t') return 'tab';
  return ch;
}
