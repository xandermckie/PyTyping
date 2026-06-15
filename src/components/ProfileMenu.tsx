import { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { sanitizeName } from '../lib/profiles';

interface ProfileMenuProps {
  /** Open the Settings view (where profiles are fully managed). */
  onManage: () => void;
}

function Avatar({ name, color, size = 24 }: { name: string; color: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full text-xs font-medium text-background-primary"
      style={{ width: size, height: size, background: color }}
    >
      {initial}
    </span>
  );
}

/**
 * Header account control. Switch the active profile or create a new one inline;
 * deeper management (rename/delete/backup) lives in Settings. Local-only — no
 * sign-in, since there is no backend.
 */
export default function ProfileMenu({ onManage }: ProfileMenuProps) {
  const { profiles, activeProfile, switchProfile, addProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const close = () => {
    setOpen(false);
    setCreating(false);
    setName('');
  };

  const submitNew = () => {
    const clean = sanitizeName(name);
    if (!clean) return;
    addProfile(clean);
    close();
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
      >
        <Avatar name={activeProfile.name} color={activeProfile.avatarColor} />
        <span className="hidden max-w-[8rem] truncate sm:inline">{activeProfile.name}</span>
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div
            role="menu"
            aria-label="Profiles"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-border-secondary bg-background-primary py-1"
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
            }}
          >
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-content-tertiary">
              Profiles
            </div>
            <ul className="max-h-56 overflow-y-auto">
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={p.id === activeProfile.id}
                    onClick={() => {
                      switchProfile(p.id);
                      close();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-content-primary hover:bg-background-secondary"
                  >
                    <Avatar name={p.name} color={p.avatarColor} />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.id === activeProfile.id && <span className="text-accent">✓</span>}
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-border-tertiary">
              {creating ? (
                <div className="flex items-center gap-2 p-2">
                  <input
                    autoFocus
                    value={name}
                    maxLength={24}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitNew();
                    }}
                    placeholder="Profile name"
                    aria-label="New profile name"
                    className="min-w-0 flex-1 rounded-md border border-border-tertiary bg-background-secondary px-2 py-1.5 text-sm text-content-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitNew}
                    className="rounded-md border border-accent px-2 py-1.5 text-sm text-accent"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full px-3 py-2 text-left text-sm text-content-secondary hover:bg-background-secondary"
                >
                  + New profile
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  close();
                  onManage();
                }}
                className="w-full px-3 py-2 text-left text-sm text-content-secondary hover:bg-background-secondary"
              >
                Manage profiles & data
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
