import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { PomodoroProvider } from './context/PomodoroContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppHeader, { type AppView } from './components/AppHeader';
import Home from './pages/Home';
import LoginScreen from './components/LoginScreen';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';
import PomodoroWidget from './components/PomodoroWidget';
import type { Command } from './components/CommandPalette';
import { EXERCISES } from './lib/exercises';
import { THEME_OPTIONS } from './lib/theme';
import { registerGlobalErrorHandlers } from './lib/global-errors';
import type { GhostSource } from './types/replay';

// Lazy-load pages not needed on the initial render — keeps the first-paint
// bundle lean. Each becomes its own chunk that Vite splits automatically.
const TypingPage = lazy(() => import('./pages/TypingPage'));
const PythonGuide = lazy(() => import('./pages/PythonGuide'));
const Contribute = lazy(() => import('./pages/Contribute'));
const GettingStarted = lazy(() => import('./pages/GettingStarted'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const RaceLobby = lazy(() => import('./pages/RaceLobby'));
const RacePage = lazy(() => import('./pages/RacePage'));
const Settings = lazy(() => import('./components/Settings'));
const ProgressTracker = lazy(() => import('./components/ProgressTracker'));
const Friends = lazy(() => import('./pages/Friends'));
const AboutLegal = lazy(() => import('./components/AboutLegal'));

function PageFallback() {
  return <div className="py-16 text-center text-sm text-content-tertiary">Loading…</div>;
}

const PAGE_TITLES: Record<AppView, string> = {
  home: 'Exercises',
  typing: 'Typing',
  settings: 'Settings',
  progress: 'Progress',
  login: 'Log in',
  about: 'About & legal',
  guide: 'Python guide',
  contribute: 'Contribute',
  'getting-started': 'Getting Started',
  leaderboard: 'Leaderboard',
  race: 'Ghost race',
  'race-run': 'Ghost race',
  friends: 'Friends',
};

/**
 * Top-level shell. Routing is a small view state machine (no router library).
 * Guest-usable by default; the login view is optional. Adds Monkeytype-isms:
 * a command line (Ctrl/⌘+K), a tips/credits footer, and a zen fade while typing.
 */
function AppShell() {
  const { settings, update } = useSettings();
  const { isGuest, logout } = useSession();
  const [view, setView] = useState<AppView>('home');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [raceGhost, setRaceGhost] = useState<{ exerciseId: string; source: GhostSource } | null>(null);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const startExercise = useCallback((id: string) => {
    setActiveId(id);
    setView('typing');
  }, []);
  const startRace = useCallback((exerciseId: string, source: GhostSource) => {
    setActiveId(exerciseId);
    setRaceGhost({ exerciseId, source });
    setView('race-run');
  }, []);
  const goHome = useCallback(() => setView('home'), []);

  useEffect(() => {
    if (view !== 'typing' && view !== 'race-run') setChromeHidden(false);
  }, [view]);

  useEffect(() => {
    document.title = `${PAGE_TITLES[view]} — PyTyping`;
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
    const themeCommands: Command[] = THEME_OPTIONS.filter((option) => option.id !== 'custom').map((option) => ({
      id: `theme-${option.id}`,
      label: `Theme: ${option.label}`,
      hint: 'theme',
      run: () => update({ themeId: option.id }),
    }));
    const cmds: Command[] = [
      { id: 'nav-getting-started', label: 'Getting Started', hint: 'navigate', run: () => setView('getting-started') },
      { id: 'nav-home', label: 'Go to Exercises', hint: 'navigate', run: () => setView('home') },
      { id: 'nav-guide', label: 'Go to Python guide', hint: 'navigate', run: () => setView('guide') },
      { id: 'nav-leaderboard', label: 'Go to Leaderboard', hint: 'navigate', run: () => setView('leaderboard') },
      { id: 'nav-race', label: 'Go to Race', hint: 'navigate', run: () => setView('race') },
      { id: 'nav-friends', label: 'Go to Friends', hint: 'navigate', run: () => setView('friends') },
      { id: 'nav-contribute', label: 'Contribute / request a language', hint: 'navigate', run: () => setView('contribute') },
      { id: 'nav-progress', label: 'Go to Progress', hint: 'navigate', run: () => setView('progress') },
      { id: 'nav-settings', label: 'Go to Settings', hint: 'navigate', run: () => setView('settings') },
      { id: 'nav-about', label: 'About & legal', hint: 'navigate', run: () => setView('about') },
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
      ...themeCommands,
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
    return <LoginScreen onDone={goHome} onGuest={goHome} onShowLegal={() => setView('about')} />;
  }

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <AppHeader
        view={view}
        chromeHidden={chromeHidden}
        onNavigate={setView}
        onGoHome={goHome}
        onShowLogin={() => setView('login')}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-8 outline-none sm:px-6">
        {view === 'home' && <Home onSelectExercise={startExercise} onNavigate={setView} />}
        <Suspense fallback={<PageFallback />}>
          {view === 'guide' && <PythonGuide />}
          {view === 'contribute' && <Contribute />}
          {view === 'typing' && activeId && (
            <TypingPage
              key={activeId}
              exerciseId={activeId}
              onExit={goHome}
              onSelectExercise={startExercise}
              onStartRace={startRace}
              onFocusChange={setChromeHidden}
            />
          )}
          {view === 'settings' && (
            <Settings onShowLogin={() => setView('login')} onManageFriends={() => setView('friends')} />
          )}
          {view === 'friends' && <Friends onShowLogin={() => setView('login')} />}
          {view === 'progress' && <ProgressTracker exercises={EXERCISES} />}
          {view === 'about' && <AboutLegal />}
          {view === 'getting-started' && <GettingStarted />}
          {view === 'leaderboard' && <Leaderboard />}
          {view === 'race' && (
            <RaceLobby onStartRace={startRace} onManageFriends={() => setView('friends')} />
          )}
          {view === 'race-run' && activeId && raceGhost && (
            <RacePage
              key={`${activeId}-${JSON.stringify(raceGhost.source)}`}
              exerciseId={activeId}
              ghostSource={raceGhost.source}
              onExit={() => setView('race')}
              onFocusChange={setChromeHidden}
            />
          )}
        </Suspense>
      </main>

      <Footer hidden={chromeHidden} onShowLegal={() => setView('about')} />

      <PomodoroWidget chromeHidden={chromeHidden} />

      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  useEffect(() => registerGlobalErrorHandlers(), []);

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <SessionProvider>
          <PomodoroProvider>
            <AppShell />
          </PomodoroProvider>
        </SessionProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
