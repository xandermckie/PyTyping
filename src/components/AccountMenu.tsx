import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { AVATAR_COLORS } from '../lib/auth';
import { sanitizeHexColor } from '../lib/validation';

interface AccountMenuProps {
  /** Open the login screen. */
  onShowLogin: () => void;
  /** Open Settings (account management). */
  onManage: () => void;
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const safeColor = sanitizeHexColor(color, AVATAR_COLORS[0]);
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-background-primary"
      style={{ background: safeColor }}
    >
      {initial}
    </span>
  );
}

/**
 * Header account control. Guests see a "Log in" affordance; logged-in users see
 * their name with a menu to open Settings or log out. Local-only — no server.
 */
export default function AccountMenu({ onShowLogin, onManage }: AccountMenuProps) {
  const { isGuest, displayName, avatarColor, logout } = useSession();
  const [open, setOpen] = useState(false);

  if (isGuest) {
    return (
      <button
        type="button"
        onClick={onShowLogin}
        className="flex items-center gap-2 rounded-md border border-border-tertiary px-3 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
      >
        Log in
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
      >
        <Avatar name={displayName} color={avatarColor} />
        <span className="hidden max-w-[8rem] truncate sm:inline">{displayName}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border-secondary bg-background-primary py-1"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          >
            <div className="px-3 py-2 text-xs text-content-tertiary">
              Signed in as <span className="text-content-secondary">{displayName}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="w-full px-3 py-2 text-left text-sm text-content-primary hover:bg-background-secondary"
            >
              Account & settings
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full px-3 py-2 text-left text-sm text-content-secondary hover:bg-background-secondary"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
