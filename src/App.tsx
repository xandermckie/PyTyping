import { useCallback, useEffect, useMemo, useState } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import TypingPage from './pages/TypingPage';
import Settings from './components/Settings';
import ProgressTracker from './components/ProgressTracker';
import ProfileMenu from './components/ProfileMenu';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';
import type { Command } from './components/CommandPalette';
import { EXERCISES } from './lib/exercises';

type View = 'home' | 'typing' | 'settings' | 'progress';

const NAV: Array<{ id: Exclude<View, 'typing'>; label: string }> = [
  { id: 'home', label: 'Exercises' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
];

/**
 * Top-level shell. Routing is a small view state machine (no router library,
 * per the "no external libraries" constraint). Adds Monkeytype-isms: a command
 * line (Ctrl/⌘+K), a tips footer, and a zen fade that hides chrome while typing.
 */
function AppShell() {
  const { settings, update } = useSettings();
  const { profiles, activeProfile, switchProfile } = useProfile();
  const [view, setView] = useState<View>('home');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const startExercise = useCallback((id: string) => {
    setActiveId(id);
    setView('typing');
  }, []);
  const goHome = useCallback(() => setView('home'), []);

  // Chrome only fades inside the typing view; reset it everywhere else.
  useEffect(() => {
    if (view !== 'typing') setChromeHidden(false);
  }, [view]);

  // Global command-line shortcut.
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
        id: 'toggle-sound',
        label: `${settings.soundEnabled ? 'Disable' : 'Enable'} error sound`,
        hint: 'setting',
        run: () => update({ soundEnabled: !settings.soundEnabled }),
      },
      {
        id: 'toggle-wpm',
        label: `${settings.liveWpm ? 'Hide' : 'Show'} live WPM`,
        hint: 'setting',
        run: () => update({ liveWpm: !settings.liveWpm }),
      },
    ];
    for (const p of profiles) {
      if (p.id !== activeProfile.id) {
        cmds.push({ id: `prof-${p.id}`, label: `Switch to ${p.name}`, hint: 'profile', run: () => switchProfile(p.id) });
      }
    }
    return cmds;
  }, [profiles, activeProfile.id, settings.lineNumbers, settings.soundEnabled, settings.liveWpm, update, switchProfile]);

  return (
    <div className="flex min-h-full flex-col">
      <header
        className={`sticky top-0 z-30 border-b border-border-tertiary bg-background-primary/90 backdrop-blur transition-opacity duration-300 ${
          chromeHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goHome}
            className="font-mono text-base font-medium text-content-primary"
            aria-label="PyTyping home"
          >
            py<span className="text-accent">typing</span>
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
              <ProfileMenu onManage={() => setView('settings')} />
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
        {view === 'settings' && <Settings />}
        {view === 'progress' && <ProgressTracker exercises={EXERCISES} />}
      </main>

      <Footer hidden={chromeHidden} />

      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ProfileProvider>
          <AppShell />
        </ProfileProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
