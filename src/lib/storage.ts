/**
 * Tiny typed wrapper around localStorage. All persistence (settings + progress)
 * goes through here so reads/writes are safe in private-mode / SSR / quota-full
 * situations (they fail soft instead of throwing).
 */

const PREFIX = 'pytyping:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Like loadJSON, but runs the parsed value through a validator. Anything the
 * validator rejects (corrupted or tampered storage) collapses to the fallback,
 * so untrusted persisted data can never reach the rest of the app unchecked.
 */
export function loadValidated<T>(key: string, validate: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return validate(undefined);
    return validate(JSON.parse(raw));
  } catch {
    return validate(undefined);
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full — ignore, the app still works in-memory */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* no-op */
  }
}
