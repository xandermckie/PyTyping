/**
 * Session state: either a guest (ephemeral, sessionStorage-scoped progress) or
 * a logged-in local account (durable, localStorage-scoped). Components read
 * `scopeId` to load/save progress for whoever is active, and `progressVersion`
 * to refresh when progress changes or the session switches.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createAccount,
  deleteAccount,
  getSession,
  loadAccounts,
  setSession as persistSession,
  verifyLogin,
} from '../lib/auth';
import type { Account, AuthResult, Session } from '../lib/auth';
import { copyScope } from '../lib/progress';

interface SessionContextValue {
  session: Session;
  account: Account | null;
  isGuest: boolean;
  /** 'guest' or the active account id — used to scope progress storage. */
  scopeId: string;
  displayName: string;
  avatarColor: string;
  accounts: Account[];
  login: (username: string, password: string) => Promise<AuthResult>;
  signup: (username: string, password: string, carryGuest: boolean) => Promise<AuthResult>;
  logout: () => void;
  removeAccount: (id: string) => void;
  progressVersion: number;
  notifyProgressChange: () => void;
  replayVersion: number;
  notifyReplayChange: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [session, setSessionState] = useState<Session>(() => {
    const s = getSession();
    // Guard against a dangling session pointing at a deleted account.
    if (s.kind === 'account' && !loadAccounts().some((a) => a.id === s.accountId)) {
      return { kind: 'guest' };
    }
    return s;
  });
  const [progressVersion, setProgressVersion] = useState(0);
  const [replayVersion, setReplayVersion] = useState(0);
  const bump = useCallback(() => setProgressVersion((v) => v + 1), []);
  const bumpReplay = useCallback(() => setReplayVersion((v) => v + 1), []);

  const account = useMemo(
    () => (session.kind === 'account' ? accounts.find((a) => a.id === session.accountId) ?? null : null),
    [session, accounts],
  );

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      try {
        const result = await verifyLogin(username, password);
        if (result.ok) {
          if (!persistSession({ kind: 'account', accountId: result.account.id })) {
            return {
              ok: false,
              error: 'Correct password, but session could not be saved. Check browser storage.',
            };
          }
          setAccounts(loadAccounts());
          setSessionState({ kind: 'account', accountId: result.account.id });
          bump();
        }
        return result;
      } catch (err) {
        if (import.meta.env.DEV) console.error('[PyTyping] Login failed:', err);
        return { ok: false, error: 'Something went wrong during login. Please try again.' };
      }
    },
    [bump],
  );

  const signup = useCallback(
    async (username: string, password: string, carryGuest: boolean): Promise<AuthResult> => {
      try {
        const result = await createAccount(username, password);
        if (result.ok) {
          if (carryGuest && !copyScope('guest', result.account.id)) {
            return {
              ok: false,
              error:
                'Account created but guest progress could not be copied. Storage may be full or disabled.',
            };
          }
          if (!persistSession({ kind: 'account', accountId: result.account.id })) {
            return {
              ok: false,
              error: 'Account created but session could not be saved. Try logging in.',
            };
          }
          setAccounts(loadAccounts());
          setSessionState({ kind: 'account', accountId: result.account.id });
          bump();
        }
        return result;
      } catch (err) {
        if (import.meta.env.DEV) console.error('[PyTyping] Signup failed:', err);
        return { ok: false, error: 'Something went wrong during signup. Please try again.' };
      }
    },
    [bump],
  );

  const logout = useCallback(() => {
    persistSession({ kind: 'guest' });
    setSessionState({ kind: 'guest' });
    bump();
  }, [bump]);

  const removeAccount = useCallback(
    (id: string) => {
      const next = deleteAccount(id);
      setAccounts(next);
      setSessionState(getSession());
      bump();
    },
    [bump],
  );

  const value = useMemo<SessionContextValue>(() => {
    const isGuest = !account;
    return {
      session,
      account,
      isGuest,
      scopeId: account ? account.id : 'guest',
      displayName: account ? account.username : 'Guest',
      avatarColor: account ? account.avatarColor : '#888780',
      accounts,
      login,
      signup,
      logout,
      removeAccount,
      progressVersion,
      notifyProgressChange: bump,
      replayVersion,
      notifyReplayChange: bumpReplay,
    };
  }, [account, session, accounts, login, signup, logout, removeAccount, progressVersion, bump, replayVersion, bumpReplay]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
