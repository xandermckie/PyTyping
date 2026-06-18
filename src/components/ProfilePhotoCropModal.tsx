import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  CROP_VIEWPORT_PX,
  clampCropPan,
  computeInitialCropTransform,
  displayScale,
  encodeCroppedAvatar,
  type CropTransform,
} from '../lib/profile-photo';

interface ProfilePhotoCropModalProps {
  open: boolean;
  imageUrl: string;
  imgWidth: number;
  imgHeight: number;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export default function ProfilePhotoCropModal({
  open,
  imageUrl,
  imgWidth,
  imgHeight,
  onClose,
  onSave,
}: ProfilePhotoCropModalProps) {
  const [transform, setTransform] = useState<CropTransform>(() => computeInitialCropTransform(imgWidth, imgHeight));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  useModalA11y({ open, onClose, containerRef: dialogRef, initialFocusRef: saveRef });

  useEffect(() => {
    if (open) {
      setTransform(computeInitialCropTransform(imgWidth, imgHeight));
      setError(null);
      setSaving(false);
    }
  }, [open, imgWidth, imgHeight]);

  const updateTransform = useCallback(
    (next: CropTransform) => {
      setTransform(clampCropPan(imgWidth, imgHeight, next));
    },
    [imgWidth, imgHeight],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    updateTransform({
      ...transform,
      offsetX: dragRef.current.startOffsetX + dx,
      offsetY: dragRef.current.startOffsetY + dy,
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleZoom = (zoom: number) => {
    const centerX = CROP_VIEWPORT_PX / 2;
    const centerY = CROP_VIEWPORT_PX / 2;
    const oldScale = displayScale(transform);
    const imgCenterX = (centerX - transform.offsetX) / oldScale;
    const imgCenterY = (centerY - transform.offsetY) / oldScale;
    const next: CropTransform = { ...transform, zoom };
    const newScale = displayScale(next);
    updateTransform({
      ...next,
      offsetX: centerX - imgCenterX * newScale,
      offsetY: centerY - imgCenterY * newScale,
    });
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img || !img.complete) {
      setError('Image is still loading. Try again in a moment.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = encodeCroppedAvatar(img, transform);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSave(result.dataUrl);
  };

  if (!open) return null;

  const scale = displayScale(transform);
  const imgW = imgWidth * scale;
  const imgH = imgHeight * scale;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-photo-title"
        className="w-full max-w-md rounded-lg border border-border-secondary bg-background-primary p-6 shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="crop-photo-title" className="text-lg font-medium text-content-primary">
          Adjust profile photo
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Drag to reposition and use the slider to zoom. The square area is your avatar.
        </p>

        <div
          className="relative mx-auto mt-4 touch-none overflow-hidden rounded-lg border border-border-tertiary bg-background-secondary"
          style={{ width: CROP_VIEWPORT_PX, height: CROP_VIEWPORT_PX }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: imgW,
              height: imgH,
              left: transform.offsetX,
              top: transform.offsetY,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-accent ring-offset-2 ring-offset-background-secondary"
            aria-hidden="true"
          />
        </div>

        <label className="mt-4 flex flex-col gap-1 text-xs text-content-secondary">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={transform.zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="Zoom crop"
          />
        </label>

        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            ref={saveRef}
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border border-accent bg-[var(--color-accent-subtle)] px-4 py-2 text-sm font-medium text-accent hover:bg-background-secondary disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save photo'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-secondary hover:bg-background-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
