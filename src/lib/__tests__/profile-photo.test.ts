import { describe, expect, it } from 'vitest';
import {
  CROP_VIEWPORT_PX,
  clampCropPan,
  computeInitialCropTransform,
  displayScale,
  isLikelyImageFile,
  validateAvatarPhotoDataUrl,
} from '../profile-photo';

/** Minimal valid 1×1 JPEG data URL. */
const TINY_JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

function mockFile(name: string, type: string, size = 100): File {
  return { name, type, size } as File;
}

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

describe('isLikelyImageFile', () => {
  it('accepts image MIME types', () => {
    expect(isLikelyImageFile(mockFile('photo', 'image/jpeg'))).toBe(true);
    expect(isLikelyImageFile(mockFile('photo', 'image/png'))).toBe(true);
    expect(isLikelyImageFile(mockFile('photo', 'image/gif'))).toBe(true);
  });

  it('accepts common extensions when MIME is empty', () => {
    expect(isLikelyImageFile(mockFile('photo.heic', ''))).toBe(true);
    expect(isLikelyImageFile(mockFile('photo.TIFF', ''))).toBe(true);
    expect(isLikelyImageFile(mockFile('avatar.webp', ''))).toBe(true);
  });

  it('rejects non-image files', () => {
    expect(isLikelyImageFile(mockFile('notes.txt', 'text/plain'))).toBe(false);
    expect(isLikelyImageFile(mockFile('doc.pdf', 'application/pdf'))).toBe(false);
  });
});

describe('crop transform helpers', () => {
  it('centers wide images in the initial crop viewport', () => {
    const t = computeInitialCropTransform(800, 400);
    expect(t.zoom).toBe(1);
    expect(t.offsetY).toBe(0);
    expect(t.offsetX).toBeLessThan(0);
    expect(displayScale(t) * 800).toBeGreaterThanOrEqual(CROP_VIEWPORT_PX);
    expect(displayScale(t) * 400).toBe(CROP_VIEWPORT_PX);
  });

  it('clamps pan so the image covers the viewport', () => {
    const initial = computeInitialCropTransform(400, 800);
    const panned = clampCropPan(400, 800, { ...initial, offsetX: 200, offsetY: 200 });
    expect(panned.offsetX).toBeLessThanOrEqual(0);
    expect(panned.offsetY).toBeLessThanOrEqual(0);
    const { width, height } = {
      width: 400 * displayScale(panned),
      height: 800 * displayScale(panned),
    };
    expect(panned.offsetX + width).toBeGreaterThanOrEqual(CROP_VIEWPORT_PX);
    expect(panned.offsetY + height).toBeGreaterThanOrEqual(CROP_VIEWPORT_PX);
  });
});
