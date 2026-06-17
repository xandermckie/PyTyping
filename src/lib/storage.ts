/**
 * Tiny typed wrapper around Web Storage. All persistence goes through here so
 * reads/writes fail soft (private mode / quota / SSR). A `store` can be passed
 * to target sessionStorage (ephemeral, used for guest progress) instead of the
 * default localStorage (durable, used for accounts + settings).
 */

const PREFIX = 'pytyping:';

function resolve(store?: Storage): Storage | null {
  try {
    return store ?? window.localStorage;
  } catch {
    return null;
  }
}

export function loadJSON<T>(key: string, fallback: T, store?: Storage): T {
  const s = resolve(store);
  if (!s) return fallback;
  try {
    const raw = s.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Like loadJSON, but runs the parsed value through a validator. Anything the
 * validator rejects (corrupted or tampered storage) collapses to the fallback.
 */
export function loadValidated<T>(key: string, validate: (raw: unknown) => T, store?: Storage): T {
  const s = resolve(store);
  try {
    const raw = s ? s.getItem(PREFIX + key) : null;
    if (raw == null) return validate(undefined);
    return validate(JSON.parse(raw));
  } catch {
    return validate(undefined);
  }
}

/** `false` when storage is unavailable, quota is exceeded, or serialization fails. */
export function saveJSON<T>(key: string, value: T, store?: Storage): boolean {
  const s = resolve(store);
  if (!s) return false;
  try {
    s.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[PyTyping] saveJSON failed:', key, err);
    return false;
  }
}

export function removeKey(key: string, store?: Storage): void {
  const s = resolve(store);
  if (!s) return;
  try {
    s.removeItem(PREFIX + key);
  } catch {
    /* no-op */
  }
}
