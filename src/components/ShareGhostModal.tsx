import { useCallback, useEffect, useState } from 'react';
import { buildFriendShareBundle, downloadFriendShareJson } from '../lib/friend-share';
import { encodeFriendCode } from '../lib/friend-codes';
import { shrinkPhotoForShare } from '../lib/profile-photo';
import type { TypingReplay } from '../types/replay';

interface ShareGhostModalProps {
  open: boolean;
  displayName: string;
  replay: TypingReplay;
  avatarPhoto?: string | null;
  onClose: () => void;
}

export default function ShareGhostModal({
  open,
  displayName,
  replay,
  avatarPhoto,
  onClose,
}: ShareGhostModalProps) {
  const [includePhoto, setIncludePhoto] = useState(Boolean(avatarPhoto));
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    let photo: string | undefined;
    if (includePhoto && avatarPhoto) {
      photo = (await shrinkPhotoForShare(avatarPhoto)) ?? undefined;
    }
    const bundle = buildFriendShareBundle(displayName, [replay], photo);
    if (!bundle) {
      setError('Could not build share bundle.');
      setCode('');
      setLoading(false);
      return;
    }
    const result = encodeFriendCode(bundle);
    if (!result.ok) {
      setError(result.error);
      setCode('');
    } else {
      setCode(result.code);
    }
    setLoading(false);
  }, [displayName, replay, includePhoto, avatarPhoto]);

  useEffect(() => {
    if (open) void generate();
  }, [open, generate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleDownload = async () => {
    let photo: string | undefined;
    if (includePhoto && avatarPhoto) {
      photo = (await shrinkPhotoForShare(avatarPhoto)) ?? undefined;
    }
    const bundle = buildFriendShareBundle(displayName, [replay], photo);
    if (bundle) downloadFriendShareJson(bundle);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-ghost-title"
        className="w-full max-w-lg rounded-lg border border-border-secondary bg-background-primary p-6 shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-ghost-title" className="text-lg font-medium text-content-primary">
          Share ghost
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Send this friend code or JSON file so others can race your run offline.
        </p>

        {avatarPhoto && (
          <label className="mt-4 flex items-center gap-2 text-sm text-content-primary">
            <input
              type="checkbox"
              checked={includePhoto}
              onChange={(e) => setIncludePhoto(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Include profile photo
          </label>
        )}

        <textarea
          readOnly
          value={loading ? 'Generating…' : code}
          rows={4}
          className="mt-4 w-full resize-none rounded-md border border-border-tertiary bg-background-secondary px-3 py-2 font-mono text-xs text-content-primary"
          aria-label="Friend code"
        />

        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        {copied && <p className="mt-2 text-sm text-success">Copied to clipboard.</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!code || loading}
            className="rounded-md border border-accent bg-[var(--color-accent-subtle)] px-4 py-2 text-sm font-medium text-accent hover:bg-background-secondary disabled:opacity-50"
          >
            Copy code
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={loading}
            className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-primary hover:bg-background-secondary disabled:opacity-50"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-secondary hover:bg-background-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
