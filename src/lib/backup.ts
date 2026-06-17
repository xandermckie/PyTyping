/**
 * Validated backup export/import + full data wipe. The backup is the portable,
 * durable form of a user's data (since there's no server): export it to a file,
 * import it on another device. Everything is re-validated on import — never
 * trusted — before being written to storage.
 */
import {
  clearAccountsAndSession,
  getSession,
  loadAccounts,
  saveAccounts,
  setSession,
  validateAccounts,
} from './auth';
import type { Account, Session } from './auth';
import {
  clearProgress,
  getHistory,
  getProgress,
  setHistory,
  setProgress,
  validateHistoryMap,
  validateProgressMap,
} from './progress';
import type { HistoryMap, ProgressMap } from './progress';
import { SETTINGS_KEY, validateSettings } from './settings';
import type { Settings } from './settings';
import { loadValidated, removeKey, saveJSON } from './storage';
import { isObject, isString } from './validation';

/** Maximum backup file size accepted on import (2 MB). */
export const BACKUP_MAX_BYTES = 2 * 1024 * 1024;

const SUPPORTED_BACKUP_VERSION = 2;

interface Backup {
  app: 'pytyping';
  version: 2;
  exportedAt: string;
  accounts: Account[];
  session: Session;
  progress: Record<string, ProgressMap>;
  history: Record<string, HistoryMap>;
  settings: Settings;
}

export function exportBackup(): string {
  const accounts = loadAccounts();
  const progress: Record<string, ProgressMap> = {};
  const history: Record<string, HistoryMap> = {};
  for (const a of accounts) {
    progress[a.id] = getProgress(a.id);
    history[a.id] = getHistory(a.id);
  }
  const backup: Backup = {
    app: 'pytyping',
    version: 2,
    exportedAt: new Date().toISOString(),
    accounts,
    session: getSession(),
    progress,
    history,
    settings: loadValidated(SETTINGS_KEY, validateSettings),
  };
  return JSON.stringify(backup, null, 2);
}

export type ImportResult = { ok: true } | { ok: false; error: string };

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
  if (parsed.version !== undefined && parsed.version !== SUPPORTED_BACKUP_VERSION) {
    return { ok: false, error: `Unsupported backup version (expected ${SUPPORTED_BACKUP_VERSION}).` };
  }

  const accounts = validateAccounts(parsed.accounts);
  const ids = new Set(accounts.map((a) => a.id));
  const rawProgress = isObject(parsed.progress) ? parsed.progress : {};
  const rawHistory = isObject(parsed.history) ? parsed.history : {};
  const settings = validateSettings(parsed.settings);

  // Drop progress for accounts that won't survive the import.
  for (const existing of loadAccounts()) {
    if (!ids.has(existing.id)) clearProgress(existing.id);
  }

  if (!saveAccounts(accounts)) {
    return { ok: false, error: 'Could not save imported accounts. Storage may be full or disabled.' };
  }
  if (!saveJSON(SETTINGS_KEY, settings)) {
    return { ok: false, error: 'Could not save imported settings. Storage may be full or disabled.' };
  }
  for (const a of accounts) {
    if (!setProgress(a.id, validateProgressMap((rawProgress as Record<string, unknown>)[a.id]))) {
      return { ok: false, error: 'Could not save imported progress. Storage may be full or disabled.' };
    }
    if (!setHistory(a.id, validateHistoryMap((rawHistory as Record<string, unknown>)[a.id]))) {
      return { ok: false, error: 'Could not save imported history. Storage may be full or disabled.' };
    }
  }

  // Restore session only if it points at an imported account.
  const session = parsed.session;
  if (isObject(session) && session.kind === 'account' && isString(session.accountId) && ids.has(session.accountId)) {
    if (!setSession({ kind: 'account', accountId: session.accountId })) {
      return { ok: false, error: 'Import succeeded but session could not be saved. Reload and log in again.' };
    }
  } else if (!setSession({ kind: 'guest' })) {
    return { ok: false, error: 'Import succeeded but session could not be saved. Reload the page.' };
  }
  return { ok: true };
}

/** Wipe everything PyTyping stored: accounts, sessions, settings, all progress. */
export function clearAllData(): void {
  clearAccountsAndSession();
  clearProgress('guest');
  removeKey(SETTINGS_KEY);
}
