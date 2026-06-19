/** Profile photo validation, crop export, and client-side resize for local avatars. */

export const AVATAR_PHOTO_MAX_BYTES = 32_000;
export const SHARE_THUMB_MAX_BYTES = 4_096;
export const AVATAR_MAX_DIM = 128;
export const SHARE_THUMB_MAX_DIM = 64;
export const CROP_VIEWPORT_PX = 280;
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const ALLOWED_PREFIXES = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'] as const;

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg|avif|heic|heif|tiff?|ico)$/i;

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

/** True when the file looks like an image (MIME or extension). */
export function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return IMAGE_EXT.test(file.name);
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = url;
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return loadImageFromUrl(dataUrl);
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

export interface CropTransform {
  /** Fit-to-cover scale before user zoom. */
  baseScale: number;
  /** User zoom multiplier (1 = fit). */
  zoom: number;
  /** Top-left of the image in viewport px. */
  offsetX: number;
  offsetY: number;
}

export function computeInitialCropTransform(imgWidth: number, imgHeight: number): CropTransform {
  const baseScale = Math.max(CROP_VIEWPORT_PX / imgWidth, CROP_VIEWPORT_PX / imgHeight);
  const w = imgWidth * baseScale;
  const h = imgHeight * baseScale;
  return {
    baseScale,
    zoom: 1,
    offsetX: (CROP_VIEWPORT_PX - w) / 2,
    offsetY: (CROP_VIEWPORT_PX - h) / 2,
  };
}

export function displayScale(transform: CropTransform): number {
  return transform.baseScale * transform.zoom;
}

export function displaySize(
  imgWidth: number,
  imgHeight: number,
  transform: CropTransform,
): { width: number; height: number } {
  const scale = displayScale(transform);
  return { width: imgWidth * scale, height: imgHeight * scale };
}

/** Clamp pan so the image always covers the square viewport. */
export function clampCropPan(
  imgWidth: number,
  imgHeight: number,
  transform: CropTransform,
): CropTransform {
  const { width, height } = displaySize(imgWidth, imgHeight, transform);
  const minX = CROP_VIEWPORT_PX - width;
  const minY = CROP_VIEWPORT_PX - height;
  return {
    ...transform,
    offsetX: Math.min(0, Math.max(minX, transform.offsetX)),
    offsetY: Math.min(0, Math.max(minY, transform.offsetY)),
  };
}

export function encodeCroppedAvatar(
  img: HTMLImageElement,
  transform: CropTransform,
  options: { maxDim?: number; maxBytes?: number } = {},
): ResizeImageResult {
  const maxDim = options.maxDim ?? AVATAR_MAX_DIM;
  const maxBytes = options.maxBytes ?? AVATAR_PHOTO_MAX_BYTES;
  const scale = displayScale(transform);
  const sw = CROP_VIEWPORT_PX / scale;
  const sh = CROP_VIEWPORT_PX / scale;
  let sx = -transform.offsetX / scale;
  let sy = -transform.offsetY / scale;

  sx = Math.max(0, Math.min(sx, img.width - sw));
  sy = Math.max(0, Math.min(sy, img.height - sh));
  const cropW = Math.min(sw, img.width - sx);
  const cropH = Math.min(sh, img.height - sy);
  const side = Math.min(cropW, cropH);

  const canvas = document.createElement('canvas');
  canvas.width = maxDim;
  canvas.height = maxDim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false, error: 'Canvas not available.' };
  ctx.drawImage(img, sx, sy, side, side, 0, 0, maxDim, maxDim);

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const dataUrl = canvasToJpeg(canvas, quality);
    const validated = validateAvatarPhotoDataUrl(dataUrl, maxBytes);
    if (validated) return { ok: true, dataUrl: validated };
  }
  return { ok: false, error: 'Could not compress cropped photo enough to save.' };
}

export type LoadImageFileResult =
  | { ok: true; img: HTMLImageElement; objectUrl: string }
  | { ok: false; error: string };

/** Load any common image file for cropping (no size cap beyond browser memory). */
export async function loadImageFileForCrop(file: File): Promise<LoadImageFileResult> {
  if (!isLikelyImageFile(file)) {
    return { ok: false, error: 'Please choose an image file.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'Image file is too large (max 100 MB).' };
  }

  // Try native object URL first (fast, works for JPEG/PNG/WebP/GIF/etc.)
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageFromUrl(objectUrl);
    if (img.width >= 1 && img.height >= 1) return { ok: true, img, objectUrl };
    URL.revokeObjectURL(objectUrl);
    return { ok: false, error: 'That image has no usable dimensions.' };
  } catch {
    URL.revokeObjectURL(objectUrl);
  }

  // ponytail: createImageBitmap handles HEIC/HEIF and other formats the <img> tag can't on some browsers
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); throw new Error('no ctx'); }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const img = await loadImageFromUrl(dataUrl);
    if (img.width < 1 || img.height < 1) return { ok: false, error: 'That image has no usable dimensions.' };
    // objectUrl is a data URL here; URL.revokeObjectURL is a no-op on data URLs
    return { ok: true, img, objectUrl: dataUrl };
  } catch {
    return {
      ok: false,
      error: 'Your browser could not open this image. Try saving it as JPEG or PNG first.',
    };
  }
}

/** Resize an uploaded image file to a JPEG data URL within size limits (no crop). */
export async function resizeImageToDataUrl(
  file: File,
  options: { maxDim?: number; maxBytes?: number } = {},
): Promise<ResizeImageResult> {
  const loaded = await loadImageFileForCrop(file);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  URL.revokeObjectURL(loaded.objectUrl);
  try {
    return encodeWithQuality(loaded.img, options.maxDim ?? AVATAR_MAX_DIM, options.maxBytes ?? AVATAR_PHOTO_MAX_BYTES);
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
