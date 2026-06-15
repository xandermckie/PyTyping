/**
 * Active-profile state. Profiles scope typing progress (offline, local-only).
 * A progressVersion counter lets progress-dependent views (Home, stats) refresh
 * after a completion is recorded without re-reading storage on every render.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createProfile,
  deleteProfile,
  ensureProfiles,
  loadProfiles,
  renameProfile,
  setActiveProfileId,
} from '../lib/profiles';
import type { Profile } from '../lib/profiles';

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile;
  activeId: string;
  switchProfile: (id: string) => void;
  addProfile: (name: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** Increments whenever progress changes; use as a memo dependency. */
  progressVersion: number;
  notifyProgressChange: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // ensureProfiles() guarantees at least one profile + a valid active id.
  const [{ profiles, activeId }, setState] = useState(() => ensureProfiles());
  const [progressVersion, setProgressVersion] = useState(0);

  const switchProfile = useCallback((id: string) => {
    setActiveProfileId(id);
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const addProfile = useCallback((name: string) => {
    const profile = createProfile(name);
    setActiveProfileId(profile.id);
    setState({ profiles: loadProfiles(), activeId: profile.id });
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const profiles = renameProfile(id, name);
    setState((s) => ({ ...s, profiles }));
  }, []);

  const remove = useCallback((id: string) => {
    deleteProfile(id);
    // ensureProfiles re-creates a Guest if the last profile was removed and
    // repoints the active id if we just deleted the active profile.
    setState(ensureProfiles());
  }, []);

  const notifyProgressChange = useCallback(() => setProgressVersion((v) => v + 1), []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? profiles[0],
    [profiles, activeId],
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      activeId,
      switchProfile,
      addProfile,
      rename,
      remove,
      progressVersion,
      notifyProgressChange,
    }),
    [profiles, activeProfile, activeId, switchProfile, addProfile, rename, remove, progressVersion, notifyProgressChange],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}
