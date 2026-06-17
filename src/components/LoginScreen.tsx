import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Logo from './Logo';
import { useSession } from '../context/SessionContext';
import { getProgress } from '../lib/progress';
import { PASSWORD_MIN, USERNAME_RULES } from '../lib/auth';

interface LoginScreenProps {
  /** Navigate away after a successful login/signup. */
  onDone: () => void;
  /** Continue without an account. */
  onGuest: () => void;
}

type Mode = 'login' | 'signup';

/**
 * Optional account gate. PyTyping is fully usable as a guest — this screen just
 * offers a local account so progress is saved on the device (and exportable)
 * instead of only living in this browser session.
 */
export default function LoginScreen({ onDone, onGuest }: LoginScreenProps) {
  const { login, signup } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [carryGuest, setCarryGuest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Offer to carry progress over only if the guest actually has some.
  const guestHasProgress = useMemo(() => Object.keys(getProgress('guest')).length > 0, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === 'login' ? await login(username, password) : await signup(username, password, carryGuest && guestHasProgress);
      if (result.ok) onDone();
      else setError(result.error);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[PyTyping] Auth submit failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-border-tertiary bg-background-secondary px-3 py-2 text-sm text-content-primary outline-none focus-visible:outline-2 focus-visible:outline-accent';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={44} wordmark={false} className="mb-4 text-content-primary" />
          <h1 className="text-lg font-medium text-content-primary">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            Save your progress on this device.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-md border border-border-tertiary p-1">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                mode === m ? 'bg-background-secondary text-content-primary' : 'text-content-secondary'
              }`}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-content-secondary">
            Username
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-content-secondary">
            Password
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {mode === 'signup' && (
            <>
              <label className="flex flex-col gap-1 text-xs text-content-secondary">
                Confirm password
                <input
                  type="password"
                  className={inputClass}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <p className="text-xs text-content-tertiary">
                Username: {USERNAME_RULES}. Password: at least {PASSWORD_MIN} characters.
              </p>
              {guestHasProgress && (
                <label className="flex items-center gap-2 text-xs text-content-secondary">
                  <input
                    type="checkbox"
                    checked={carryGuest}
                    onChange={(e) => setCarryGuest(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  Bring my guest progress into this account
                </label>
              )}
            </>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-md border border-accent bg-background-secondary px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-background-tertiary disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button type="button" onClick={onGuest} className="text-sm text-content-secondary underline-offset-2 hover:underline">
            Continue as guest
          </button>
          <p className="mt-3 text-xs text-content-tertiary">
            Accounts are stored locally on this device — there is no server. Guest progress is kept
            only for this browser session. Use Export backup in Settings to move data between devices.
          </p>
        </div>
      </div>
    </div>
  );
}
