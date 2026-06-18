import { describe, expect, it } from 'vitest';
import { validateAvatarPhotoDataUrl } from '../profile-photo';

/** Minimal valid 1×1 JPEG data URL. */
const TINY_JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

describe('validateAvatarPhotoDataUrl', () => {
  it('accepts a small JPEG data URL', () => {
    expect(validateAvatarPhotoDataUrl(TINY_JPEG)).toBe(TINY_JPEG);
  });

  it('rejects non-data URLs', () => {
    expect(validateAvatarPhotoDataUrl('https://example.com/a.jpg')).toBeNull();
  });

  it('rejects javascript payloads', () => {
    expect(validateAvatarPhotoDataUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
  });

  it('rejects invalid base64', () => {
    expect(validateAvatarPhotoDataUrl('data:image/jpeg;base64,!!!')).toBeNull();
  });

  it('rejects oversized strings', () => {
    const huge = `data:image/jpeg;base64,${'A'.repeat(50_000)}`;
    expect(validateAvatarPhotoDataUrl(huge)).toBeNull();
  });
});
