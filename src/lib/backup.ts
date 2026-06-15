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

  const accounts = validateAccounts(parsed.accounts);
  const ids = new Set(accounts.map((a) => a.id));
  const rawProgress = isObject(parsed.progress) ? parsed.progress : {};
  const rawHistory = isObject(parsed.history) ? parsed.history : {};
  const settings = validateSettings(parsed.settings);

  // Drop progress for accounts that won't survive the import.
  for (const existing of loadAccounts()) {
    if (!ids.has(existing.id)) clearProgress(existing.id);
  }

  saveAccounts(accounts);
  saveJSON(SETTINGS_KEY, settings);
  for (const a of accounts) {
    setProgress(a.id, validateProgressMap((rawProgress as Record<string, unknown>)[a.id]));
    setHistory(a.id, validateHistoryMap((rawHistory as Record<string, unknown>)[a.id]));
  }

  // Restore session only if it points at an imported account.
  const session = parsed.session;
  if (isObject(session) && session.kind === 'account' && isString(session.accountId) && ids.has(session.accountId)) {
    setSession({ kind: 'account', accountId: session.accountId });
  } else {
    setSession({ kind: 'guest' });
  }
  return { ok: true };
}

/** Wipe everything PyTyping stored: accounts, sessions, settings, all progress. */
export function clearAllData(): void {
  clearAccountsAndSession();
  clearProgress('guest');
  removeKey(SETTINGS_KEY);
}
