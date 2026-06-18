/** Profile photo validation and client-side resize for local avatars. */

export const AVATAR_PHOTO_MAX_BYTES = 32_000;
export const SHARE_THUMB_MAX_BYTES = 4_096;
export const AVATAR_MAX_DIM = 128;
export const SHARE_THUMB_MAX_DIM = 64;

const ALLOWED_PREFIXES = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'] as const;

function base64DecodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function isValidBase64Payload(payload: string): boolean {
  if (payload.length === 0 || payload.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(payload);
}

/** Validate a stored avatar data URL; returns cleaned URL or null. */
export function validateAvatarPhotoDataUrl(url: unknown, maxBytes = AVATAR_PHOTO_MAX_BYTES): string | null {
  if (typeof url !== 'string') return null;
  const prefix = ALLOWED_PREFIXES.find((p) => url.startsWith(p));
  if (!prefix) return null;
  const payload = url.slice(prefix.length);
  if (!isValidBase64Payload(payload)) return null;
  if (base64DecodedSize(payload) > maxBytes) return null;
  if (url.length > maxBytes * 2) return null;
  return url;
}

export type ResizeImageResult = { ok: true; dataUrl: string } | { ok: false; error: string };

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image.'));
    };
    img.src = url;
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = dataUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL('image/jpeg', quality);
}

function drawResized(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available.');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

async function encodeWithQuality(
  img: HTMLImageElement,
  maxDim: number,
  maxBytes: number,
): Promise<ResizeImageResult> {
  const canvas = drawResized(img, maxDim);
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const dataUrl = canvasToJpeg(canvas, quality);
    const validated = validateAvatarPhotoDataUrl(dataUrl, maxBytes);
    if (validated) return { ok: true, dataUrl: validated };
  }
  return { ok: false, error: 'Image is too large even after compression.' };
}

/** Resize an uploaded image file to a JPEG data URL within size limits. */
export async function resizeImageToDataUrl(
  file: File,
  options: { maxDim?: number; maxBytes?: number } = {},
): Promise<ResizeImageResult> {
  const maxDim = options.maxDim ?? AVATAR_MAX_DIM;
  const maxBytes = options.maxBytes ?? AVATAR_PHOTO_MAX_BYTES;
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please choose a JPEG, PNG, or WebP image.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'Image file is too large (max 5 MB before resize).' };
  }
  try {
    const img = await loadImageFromFile(file);
    return encodeWithQuality(img, maxDim, maxBytes);
  } catch {
    return { ok: false, error: 'Could not process that image.' };
  }
}

/** Shrink an existing avatar data URL for friend-code sharing. */
export async function shrinkPhotoForShare(dataUrl: string): Promise<string | null> {
  const validated = validateAvatarPhotoDataUrl(dataUrl);
  if (!validated) return null;
  try {
    const img = await loadImageFromDataUrl(validated);
    const result = await encodeWithQuality(img, SHARE_THUMB_MAX_DIM, SHARE_THUMB_MAX_BYTES);
    return result.ok ? result.dataUrl : null;
  } catch {
    return null;
  }
}
