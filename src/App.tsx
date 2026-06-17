import { useCallback, useEffect, useMemo, useState } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SessionProvider, useSession } from './context/SessionContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import TypingPage from './pages/TypingPage';
import Settings from './components/Settings';
import ProgressTracker from './components/ProgressTracker';
import AccountMenu from './components/AccountMenu';
import LoginScreen from './components/LoginScreen';
import AboutLegal from './components/AboutLegal';
import Footer from './components/Footer';
import Logo from './components/Logo';
import CommandPalette from './components/CommandPalette';
import type { Command } from './components/CommandPalette';
import { EXERCISES } from './lib/exercises';

type View = 'home' | 'typing' | 'settings' | 'progress' | 'login' | 'about';

const NAV: Array<{ id: Exclude<View, 'typing' | 'login' | 'about'>; label: string }> = [
  { id: 'home', label: 'Exercises' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
];

/**
 * Top-level shell. Routing is a small view state machine (no router library).
 * Guest-usable by default; the login view is optional. Adds Monkeytype-isms:
 * a command line (Ctrl/⌘+K), a tips/credits footer, and a zen fade while typing.
 */
function AppShell() {
  const { settings, update } = useSettings();
  const { isGuest, logout } = useSession();
  const [view, setView] = useState<View>('home');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const startExercise = useCallback((id: string) => {
    setActiveId(id);
    setView('typing');
  }, []);
  const goHome = useCallback(() => setView('home'), []);

  useEffect(() => {
    if (view !== 'typing') setChromeHidden(false);
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      { id: 'nav-home', label: 'Go to Exercises', hint: 'navigate', run: () => setView('home') },
      { id: 'nav-progress', label: 'Go to Progress', hint: 'navigate', run: () => setView('progress') },
      { id: 'nav-settings', label: 'Go to Settings', hint: 'navigate', run: () => setView('settings') },
      { id: 'nav-about', label: 'About & legal', hint: 'navigate', run: () => setView('about') },
      { id: 'theme-light', label: 'Theme: Light', hint: 'theme', run: () => update({ themeId: 'light' }) },
      { id: 'theme-monokia', label: 'Theme: Monokia', hint: 'theme', run: () => update({ themeId: 'monokia' }) },
      { id: 'theme-custom', label: 'Theme: Custom', hint: 'theme', run: () => update({ themeId: 'custom' }) },
      {
        id: 'toggle-line',
        label: `${settings.lineNumbers ? 'Hide' : 'Show'} line numbers`,
        hint: 'setting',
        run: () => update({ lineNumbers: !settings.lineNumbers }),
      },
      {
        id: 'toggle-wpm',
        label: `${settings.liveWpm ? 'Hide' : 'Show'} live WPM`,
        hint: 'setting',
        run: () => update({ liveWpm: !settings.liveWpm }),
      },
    ];
    if (isGuest) {
      cmds.push({ id: 'login', label: 'Log in / Sign up', hint: 'account', run: () => setView('login') });
    } else {
      cmds.push({ id: 'logout', label: 'Log out', hint: 'account', run: logout });
    }
    return cmds;
  }, [isGuest, logout, settings.lineNumbers, settings.liveWpm, update]);

  // The login screen is a focused, full-page view without the app chrome.
  if (view === 'login') {
    return <LoginScreen onDone={goHome} onGuest={goHome} />;
  }

  return (
    <div className="flex min-h-full flex-col">
      <header
        className={`sticky top-0 z-30 border-b border-border-tertiary bg-background-primary/90 backdrop-blur transition-opacity duration-300 ${
          chromeHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button type="button" onClick={goHome} className="rounded-md focus-visible:outline-none" aria-label="PyTyping home">
            <Logo size={26} />
          </button>
          <div className="flex items-center gap-1">
            <nav className="flex gap-1" aria-label="Primary">
              {NAV.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setView(item.id)}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active ? 'text-accent' : 'text-content-secondary hover:bg-background-secondary'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="ml-1 border-l border-border-tertiary pl-1">
              <AccountMenu onShowLogin={() => setView('login')} onManage={() => setView('settings')} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        {view === 'home' && <Home onSelectExercise={startExercise} />}
        {view === 'typing' && activeId && (
          <TypingPage
            key={activeId}
            exerciseId={activeId}
            onExit={goHome}
            onSelectExercise={startExercise}
            onFocusChange={setChromeHidden}
          />
        )}
        {view === 'settings' && <Settings onShowLogin={() => setView('login')} />}
        {view === 'progress' && <ProgressTracker exercises={EXERCISES} />}
        {view === 'about' && <AboutLegal />}
      </main>

      <Footer hidden={chromeHidden} onShowLegal={() => setView('about')} />

      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onRejection = (e: PromiseRejectionEvent) => {
      console.error('[PyTyping] Unhandled rejection:', e.reason);
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <SessionProvider>
          <AppShell />
        </SessionProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
