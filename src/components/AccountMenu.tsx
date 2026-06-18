import { useMemo, useRef, useState } from 'react';
import RankBadge from './RankBadge';
import { useSession } from '../context/SessionContext';
import { getRaceRankState } from '../lib/race-rank';
import { AVATAR_COLORS } from '../lib/auth';
import { sanitizeHexColor } from '../lib/validation';
import DisclosurePanel from './DisclosurePanel';

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
  const { isGuest, displayName, avatarColor, logout, scopeId, replayVersion } = useSession();
  const peakRaceWpm = useMemo(
    () => getRaceRankState(scopeId).peakRaceWpm,
    [scopeId, replayVersion],
  );
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  if (isGuest) {
    return (
      <button
        type="button"
        onClick={onShowLogin}
        className="flex items-center gap-2 rounded-md border border-border-tertiary px-2.5 py-1.5 text-sm text-content-secondary hover:bg-background-secondary sm:px-3"
      >
        Log in
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
      >
        <Avatar name={displayName} color={avatarColor} />
        <span className="hidden max-w-[8rem] truncate sm:inline">{displayName}</span>
        <span className="hidden sm:inline">
          <RankBadge wpm={peakRaceWpm} />
        </span>
      </button>

      <DisclosurePanel
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={toggleRef}
        initialFocusRef={firstItemRef}
        ariaLabel="Account"
        panelClassName="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border-secondary bg-background-primary py-1 shadow-[var(--shadow-sm)]"
      >
        <div
          id="account-menu"
          role="menu"
          aria-label="Account"
          className="py-1"
        >
          <div className="px-3 py-2 text-xs text-content-tertiary" role="presentation">
            Signed in as <span className="text-content-secondary">{displayName}</span>
          </div>
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
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
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full px-3 py-2 text-left text-sm text-content-secondary hover:bg-background-secondary"
          >
            Log out
          </button>
        </div>
      </DisclosurePanel>
    </div>
  );
}
