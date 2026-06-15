import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useSettings } from '../context/SettingsContext';
import { CODE_FONTS, UI_FONTS } from '../lib/settings';
import { useProfile } from '../context/ProfileContext';
import { exportBackup, importBackup } from '../lib/profiles';
import type { BaseColors, ThemeId } from '../lib/theme';

/** Labels for the 8 editable custom-theme colors (Guide §IV). */
const COLOR_FIELDS: Array<{ key: keyof BaseColors; label: string }> = [
  { key: 'background', label: 'Background' },
  { key: 'textPrimary', label: 'Text' },
  { key: 'textSecondary', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
  { key: 'error', label: 'Error' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'border', label: 'Border' },
];

const THEMES: Array<{ id: ThemeId; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'monokia', label: 'Monokia' },
  { id: 'custom', label: 'Custom' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-colors ${
        checked ? 'border-accent bg-accent' : 'border-border-secondary bg-background-tertiary'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background-primary transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <div className="text-sm text-content-primary">{label}</div>
        {hint && <div className="text-xs text-content-tertiary">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-content-secondary">{children}</h2>
  );
}

const selectClass =
  'rounded-md border border-border-tertiary bg-background-secondary px-3 py-1.5 text-sm text-content-primary';
const btnClass =
  'rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-secondary transition-colors hover:bg-background-secondary';

/**
 * Customization + account surface. Theme/typography/behavior apply live via CSS
 * variables. Profile management and validated backup export/import live at the
 * bottom. A restore reloads the page so every context re-initializes cleanly.
 */
export default function Settings() {
  const { settings, update, reset } = useSettings();
  const { profiles, activeProfile, switchProfile, rename, remove } = useProfile();

  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const setColor = (key: keyof BaseColors, value: string) => {
    update({ themeId: 'custom', customColors: { ...settings.customColors, [key]: value } });
  };

  const downloadBackup = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pytyping-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const result = importBackup(text);
      if (result.ok) window.location.reload();
      else setImportError(result.error);
    } catch {
      setImportError('Could not read that file.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <h1 className="mb-8 text-lg font-medium text-content-primary">Settings</h1>

      {/* Theme */}
      <section className="mb-8">
        <SectionTitle>Theme</SectionTitle>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={settings.themeId === t.id}
              onClick={() => update({ themeId: t.id })}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                settings.themeId === t.id
                  ? 'border-accent text-accent'
                  : 'border-border-tertiary text-content-secondary hover:bg-background-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {settings.themeId === 'custom' && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLOR_FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1 text-xs text-content-secondary">
                {f.label}
                <input
                  type="color"
                  value={settings.customColors[f.key]}
                  onChange={(e) => setColor(f.key, e.target.value)}
                  className="h-9 w-full cursor-pointer rounded-md border border-border-tertiary bg-background-secondary"
                  aria-label={`${f.label} color`}
                />
              </label>
            ))}
          </div>
        )}

        <div
          className="mt-4 rounded-lg border border-border-tertiary bg-background-secondary p-4 font-mono text-sm leading-[1.6]"
          aria-hidden="true"
        >
          <div>
            <span className="token keyword">def</span> <span className="token function">greet</span>
            <span className="token punctuation">(</span>name<span className="token punctuation">)</span>
            <span className="token punctuation">:</span>
          </div>
          <div>
            {'    '}
            <span className="token keyword">return</span>{' '}
            <span className="token string">f"Hello, {'{name}'}!"</span>{' '}
            <span className="token comment"># greet by name</span>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-8">
        <SectionTitle>Typography</SectionTitle>
        <div className="divide-y divide-border-tertiary border-y border-border-tertiary">
          <Row label="Code font">
            <select className={selectClass} value={settings.codeFont} onChange={(e) => update({ codeFont: e.target.value })}>
              {CODE_FONTS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="UI font">
            <select className={selectClass} value={settings.uiFont} onChange={(e) => update({ uiFont: e.target.value })}>
              {UI_FONTS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Code size" hint={`${settings.codeFontSize}px`}>
            <input
              type="range"
              min={12}
              max={20}
              step={1}
              value={settings.codeFontSize}
              onChange={(e) => update({ codeFontSize: Number(e.target.value) })}
              className="w-40 accent-[var(--color-accent)]"
              aria-label="Code font size"
            />
          </Row>
        </div>
      </section>

      {/* Behavior */}
      <section className="mb-8">
        <SectionTitle>Behavior</SectionTitle>
        <div className="divide-y divide-border-tertiary border-y border-border-tertiary">
          <Row label="Tab size" hint="Spaces a Tab key inserts">
            <select className={selectClass} value={settings.tabSize} onChange={(e) => update({ tabSize: Number(e.target.value) })}>
              {[2, 4, 8].map((n) => (
                <option key={n} value={n}>
                  {n} spaces
                </option>
              ))}
            </select>
          </Row>
          <Row label="Line numbers">
            <Toggle label="Line numbers" checked={settings.lineNumbers} onChange={(v) => update({ lineNumbers: v })} />
          </Row>
          <Row label="Live WPM" hint="Show typing speed while you type">
            <Toggle label="Live WPM" checked={settings.liveWpm} onChange={(v) => update({ liveWpm: v })} />
          </Row>
          <Row label="Caret blink" hint="Off = steady caret">
            <Toggle label="Caret blink" checked={settings.caretBlink} onChange={(v) => update({ caretBlink: v })} />
          </Row>
          <Row label="Error sound" hint="Soft tone on a wrong keystroke (off by default)">
            <Toggle label="Error sound" checked={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />
          </Row>
        </div>
        <button type="button" onClick={reset} className={`mt-4 ${btnClass}`}>
          Reset settings to defaults
        </button>
      </section>

      {/* Profiles */}
      <section className="mb-8">
        <SectionTitle>Profiles</SectionTitle>
        <p className="mb-4 text-xs text-content-tertiary">
          Profiles are stored only on this device — there's no account or server.
        </p>

        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-content-secondary">
            Active profile name
            <input
              key={activeProfile.id}
              ref={nameRef}
              defaultValue={activeProfile.name}
              maxLength={24}
              className="rounded-md border border-border-tertiary bg-background-secondary px-3 py-1.5 text-sm text-content-primary outline-none"
              aria-label="Active profile name"
            />
          </label>
          <button
            type="button"
            onClick={() => nameRef.current && rename(activeProfile.id, nameRef.current.value)}
            className={btnClass}
          >
            Save name
          </button>
        </div>

        <ul className="mt-4 divide-y divide-border-tertiary border-y border-border-tertiary">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <button
                type="button"
                onClick={() => switchProfile(p.id)}
                className="flex items-center gap-2 text-sm text-content-primary"
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: p.avatarColor }}
                  aria-hidden="true"
                />
                {p.name}
                {p.id === activeProfile.id && <span className="text-xs text-accent">active</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete profile "${p.name}" and its progress?`)) remove(p.id);
                }}
                className="rounded-md border border-border-tertiary px-3 py-1 text-xs text-error hover:bg-background-secondary"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Data */}
      <section>
        <SectionTitle>Data</SectionTitle>
        <p className="mb-4 text-xs text-content-tertiary">
          Back up all profiles, progress, and settings to a JSON file, or restore from one.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadBackup} className={btnClass}>
            Export backup
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnClass}>
            Import backup…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
            aria-hidden="true"
          />
        </div>
        {importError && <p className="mt-3 text-sm text-error">{importError}</p>}
      </section>
    </div>
  );
}
