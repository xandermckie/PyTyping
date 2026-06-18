import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import Avatar from './Avatar';
import ProfilePhotoCropModal from './ProfilePhotoCropModal';
import { useSettings } from '../context/SettingsContext';
import { CODE_FONTS, UI_FONTS } from '../lib/settings';
import { useSession } from '../context/SessionContext';
import { exportBackup, importBackup, BACKUP_MAX_BYTES } from '../lib/backup';
import { loadImageFileForCrop } from '../lib/profile-photo';
import { THEME_OPTIONS } from '../lib/theme';
import type { BaseColors } from '../lib/theme';

interface SettingsProps {
  /** Open the login screen (shown to guests). */
  onShowLogin: () => void;
  /** Open the Friends page. */
  onManageFriends?: () => void;
}

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
  return <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-content-secondary">{children}</h2>;
}

const selectClass =
  'rounded-md border border-border-tertiary bg-background-secondary px-3 py-1.5 text-sm text-content-primary';
const btnClass =
  'rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-secondary transition-colors hover:bg-background-secondary';

interface CropSession {
  objectUrl: string;
  imgWidth: number;
  imgHeight: number;
}

export default function Settings({ onShowLogin, onManageFriends }: SettingsProps) {
  const { settings, update, reset, persistError } = useSettings();
  const { isGuest, account, displayName, avatarColor, avatarPhoto, setAvatarPhoto, logout, removeAccount } =
    useSession();

  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);

  const closeCrop = () => {
    if (cropSession) URL.revokeObjectURL(cropSession.objectUrl);
    setCropSession(null);
  };

  const setColor = (key: keyof BaseColors, value: string) => {
    update({ themeId: 'custom', customColors: { ...settings.customColors, [key]: value } });
  };

  const downloadBackup = () => {
    setExportError(null);
    try {
      const blob = new Blob([exportBackup()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pytyping-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[PyTyping] Export failed:', err);
      setExportError('Could not export backup. Please try again.');
    }
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError(null);
    if (file.size === 0) {
      setImportError('That file is empty.');
      return;
    }
    if (file.size > BACKUP_MAX_BYTES) {
      setImportError('Backup file is too large (max 2 MB).');
      return;
    }
    try {
      const result = importBackup(await file.text());
      if (result.ok) window.location.reload();
      else setImportError(result.error);
    } catch {
      setImportError('Could not read that file.');
    }
  };

  const onPhotoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    closeCrop();
    const result = await loadImageFileForCrop(file);
    if (!result.ok) {
      setPhotoError(result.error);
      return;
    }
    setCropSession({
      objectUrl: result.objectUrl,
      imgWidth: result.img.width,
      imgHeight: result.img.height,
    });
  };

  const onCropSave = (dataUrl: string) => {
    closeCrop();
    if (!setAvatarPhoto(dataUrl)) {
      setPhotoError('Could not save profile photo. Storage may be full.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <h1 className="mb-8 text-lg font-medium text-content-primary">Settings</h1>

      {persistError && <p className="mb-6 text-sm text-error">{persistError}</p>}

      {/* Account */}
      <section className="mb-8">
        <SectionTitle>Account</SectionTitle>
        {isGuest ? (
          <div className="rounded-lg border border-border-tertiary bg-background-secondary p-4">
            <p className="text-sm text-content-primary">You&apos;re playing as a guest.</p>
            <p className="mt-1 text-sm text-content-secondary">
              Guest progress is saved only for this browser session. Log in or create an account to
              save it on this device permanently.
            </p>
            <button
              type="button"
              onClick={onShowLogin}
              className="mt-4 rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-background-tertiary"
            >
              Log in or create account
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-border-tertiary bg-background-secondary p-4">
            <div className="flex items-center gap-3">
              <Avatar name={displayName} color={avatarColor} photoUrl={avatarPhoto} size="md" />
              <div>
                <p className="text-sm text-content-primary">
                  Signed in as <span className="font-medium">{displayName}</span>
                </p>
                <p className="mt-1 text-xs text-content-tertiary">
                  Stored locally on this device. No cloud sync. Use Export backup to move between devices.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={logout} className={btnClass}>
                Log out
              </button>
              {onManageFriends && (
                <button type="button" onClick={onManageFriends} className={btnClass}>
                  Manage friends
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (account && window.confirm('Delete this account and all of its saved progress on this device?')) {
                    removeAccount(account.id);
                  }
                }}
                className="rounded-md border border-error px-4 py-2 text-sm text-error transition-colors hover:bg-background-tertiary"
              >
                Delete account
              </button>
            </div>
          </div>
        )}
      </section>

      {!isGuest && (
        <section className="mb-8">
          <SectionTitle>Profile photo</SectionTitle>
          <div className="rounded-lg border border-border-tertiary bg-background-secondary p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={displayName} color={avatarColor} photoUrl={avatarPhoto} size="lg" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => photoRef.current?.click()} className={btnClass}>
                  Upload photo
                </button>
                {avatarPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoError(null);
                      if (!setAvatarPhoto(null)) setPhotoError('Could not remove profile photo.');
                    }}
                    className={btnClass}
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={onPhotoFile}
                className="hidden"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-xs text-content-tertiary">
              Any image format your browser can open (JPEG, PNG, GIF, WebP, and more). Drag and crop before
              saving. Stored locally and included in backup exports.
            </p>
            {photoError && <p className="mt-2 text-sm text-error">{photoError}</p>}
          </div>
        </section>
      )}

      {cropSession && (
        <ProfilePhotoCropModal
          open
          imageUrl={cropSession.objectUrl}
          imgWidth={cropSession.imgWidth}
          imgHeight={cropSession.imgHeight}
          onClose={closeCrop}
          onSave={onCropSave}
        />
      )}

      {/* Theme */}
      <section className="mb-8">
        <SectionTitle>Theme</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEME_OPTIONS.map((t) => (
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
          <Row label="Record replays" hint="Save typing replays for ghost racing (race mode always records)">
            <Toggle
              label="Record replays"
              checked={settings.recordReplays}
              onChange={(v) => update({ recordReplays: v })}
            />
          </Row>
        </div>
        <button type="button" onClick={reset} className={`mt-4 ${btnClass}`}>
          Reset settings to defaults
        </button>
      </section>

      <section>
        <SectionTitle>Pomodoro</SectionTitle>
        <div className="space-y-4">
          <Row label="Focus length" hint="Minutes per focus session">
            <input
              type="number"
              min={5}
              max={90}
              value={settings.pomodoroFocusMinutes}
              onChange={(e) => update({ pomodoroFocusMinutes: Number(e.target.value) })}
              className={selectClass}
            />
          </Row>
          <Row label="Break length" hint="Minutes per break">
            <input
              type="number"
              min={1}
              max={30}
              value={settings.pomodoroBreakMinutes}
              onChange={(e) => update({ pomodoroBreakMinutes: Number(e.target.value) })}
              className={selectClass}
            />
          </Row>
          <Row label="Phase notifications" hint="Browser notification when a phase ends">
            <Toggle
              label="Phase notifications"
              checked={settings.pomodoroNotifications}
              onChange={(v) => {
                update({ pomodoroNotifications: v });
                if (v) void import('../lib/notifications').then((m) => m.requestNotificationPermission());
              }}
            />
          </Row>
        </div>
      </section>

      {/* Data */}
      <section>
        <SectionTitle>Data</SectionTitle>
        <p className="mb-4 text-xs text-content-tertiary">
          Back up all accounts, progress, and settings to a JSON file, or restore from one. This is
          how you move data between devices (there is no server).
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
        {exportError && <p className="mt-3 text-sm text-error">{exportError}</p>}
      </section>
    </div>
  );
}
