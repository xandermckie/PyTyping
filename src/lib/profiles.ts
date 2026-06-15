/**
 * Local user profiles. There is no backend (offline-first), so a "profile" is
 * just a named bucket in localStorage that scopes typing progress. Includes a
 * validated backup export/import so a user can move their data between devices.
 */
import { loadJSON, loadValidated, saveJSON, removeKey } from './storage';
import { isObject, isString } from './validation';
import { clearProgress, getProgress, progressKey, setProgress, validateProgressMap } from './progress';
import type { ProgressMap } from './progress';
import { SETTINGS_KEY, validateSettings } from './settings';
import type { Settings } from './settings';

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  /** Hex color for the avatar chip. */
  avatarColor: string;
}

const PROFILES_KEY = 'profiles';
const ACTIVE_KEY = 'activeProfileId';
const NAME_MAX = 24;

const AVATAR_COLORS = ['#1d9e75', '#e2b714', '#7aa2f7', '#e24b4a', '#c792ea', '#88b04b', '#e0af68'];

/** Crypto-strong id when available, with a safe fallback. */
function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Trim, strip ASCII control characters, and cap length so names stay
 * display-safe. Done by code point (not a regex) to avoid embedding control
 * bytes in source.
 */
export function sanitizeName(raw: string): string {
  let cleaned = '';
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) cleaned += ch;
  }
  return cleaned.trim().slice(0, NAME_MAX);
}

function validateProfile(raw: unknown): Profile | null {
  if (!isObject(raw) || !isString(raw.id) || !isString(raw.name)) return null;
  const name = sanitizeName(raw.name) || 'Profile';
  return {
    id: raw.id,
    name,
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    avatarColor: isString(raw.avatarColor) ? raw.avatarColor : AVATAR_COLORS[0],
  };
}

function validateProfiles(raw: unknown): Profile[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Profile[] = [];
  for (const item of raw) {
    const p = validateProfile(item);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export function loadProfiles(): Profile[] {
  return loadValidated(PROFILES_KEY, validateProfiles);
}

function saveProfiles(profiles: Profile[]): void {
  saveJSON(PROFILES_KEY, profiles);
}

export function getActiveProfileId(): string {
  return loadJSON<string>(ACTIVE_KEY, '');
}

export function setActiveProfileId(id: string): void {
  saveJSON(ACTIVE_KEY, id);
}

function makeProfile(name: string): Profile {
  return {
    id: uid(),
    name: sanitizeName(name) || 'Profile',
    createdAt: new Date().toISOString(),
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };
}

/**
 * Guarantee a valid set of profiles + a valid active id. Called once at startup
 * so the rest of the app can assume an active profile always exists.
 */
export function ensureProfiles(): { profiles: Profile[]; activeId: string } {
  let profiles = loadProfiles();
  if (profiles.length === 0) {
    profiles = [makeProfile('Guest')];
    saveProfiles(profiles);
  }
  let activeId = getActiveProfileId();
  if (!profiles.some((p) => p.id === activeId)) {
    activeId = profiles[0].id;
    setActiveProfileId(activeId);
  }
  return { profiles, activeId };
}

export function createProfile(name: string): Profile {
  const profile = makeProfile(name);
  saveProfiles([...loadProfiles(), profile]);
  return profile;
}

export function renameProfile(id: string, name: string): Profile[] {
  const profiles = loadProfiles().map((p) =>
    p.id === id ? { ...p, name: sanitizeName(name) || p.name } : p,
  );
  saveProfiles(profiles);
  return profiles;
}

export function deleteProfile(id: string): Profile[] {
  clearProgress(id);
  const profiles = loadProfiles().filter((p) => p.id !== id);
  saveProfiles(profiles);
  return profiles;
}

/* ------------------------------- backups --------------------------------- */

interface Backup {
  app: 'pytyping';
  version: 1;
  exportedAt: string;
  activeProfileId: string;
  profiles: Profile[];
  progress: Record<string, ProgressMap>;
  settings: Settings;
}

/** Serialize all profiles, their progress, and settings into a backup string. */
export function exportBackup(): string {
  const profiles = loadProfiles();
  const progress: Record<string, ProgressMap> = {};
  for (const p of profiles) progress[p.id] = getProgress(p.id);
  const backup: Backup = {
    app: 'pytyping',
    version: 1,
    exportedAt: new Date().toISOString(),
    activeProfileId: getActiveProfileId(),
    profiles,
    progress,
    settings: loadValidated(SETTINGS_KEY, validateSettings),
  };
  return JSON.stringify(backup, null, 2);
}

export type ImportResult = { ok: true } | { ok: false; error: string };

/**
 * Validate and apply a backup file. Everything is re-validated (never trusted)
 * before being written to storage. The caller should reload so all contexts
 * re-initialize cleanly from the restored data.
 */
export function importBackup(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!isObject(parsed) || parsed.app !== 'pytyping') {
    return { ok: false, error: 'This does not look like a PyTyping backup.' };
  }

  let profiles = validateProfiles(parsed.profiles);
  if (profiles.length === 0) profiles = [makeProfile('Guest')];

  const ids = new Set(profiles.map((p) => p.id));
  const activeId =
    isString(parsed.activeProfileId) && ids.has(parsed.activeProfileId)
      ? parsed.activeProfileId
      : profiles[0].id;

  const rawProgress = isObject(parsed.progress) ? parsed.progress : {};
  const settings = validateSettings(parsed.settings);

  // Clear any progress keys for profiles that won't survive the import.
  for (const existing of loadProfiles()) {
    if (!ids.has(existing.id)) clearProgress(existing.id);
  }

  saveProfiles(profiles);
  setActiveProfileId(activeId);
  saveJSON(SETTINGS_KEY, settings);
  for (const p of profiles) {
    setProgress(p.id, validateProgressMap((rawProgress as Record<string, unknown>)[p.id]));
  }
  return { ok: true };
}

/** Wipe everything PyTyping has stored (used by the error-recovery screen). */
export function clearAllData(): void {
  for (const p of loadProfiles()) removeKey(progressKey(p.id));
  removeKey(PROFILES_KEY);
  removeKey(ACTIVE_KEY);
  removeKey(SETTINGS_KEY);
}
