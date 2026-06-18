import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface Command {
  id: string;
  label: string;
  /** Short right-aligned hint, e.g. a section name. */
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

/**
 * Monkeytype-style command line (Ctrl/⌘+K). Fuzzy-ish substring filter, full
 * keyboard control (↑/↓ to move, Enter to run, Esc to close). Opens focused on
 * the search box and restores nothing — callers re-open as needed.
 */
export default function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [cmdError, setCmdError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query/selection and focus the field each time it opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setCmdError(null);
      // Focus after paint so the input exists.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q));
  }, [commands, query]);

  // Keep the active index in range as the list shrinks.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  const runCommand = (cmd: Command) => {
    try {
      cmd.run();
      onClose();
    } catch (err) {
      if (import.meta.env.DEV) console.error('[PyTyping] Command failed:', cmd.id, err);
      setCmdError('That command failed. Please try again.');
    }
  };

  const runActive = () => {
    const cmd = filtered[active];
    if (cmd) runCommand(cmd);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case 'Enter':
        e.preventDefault();
        runActive();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[15vh]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command line"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-secondary bg-background-primary"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command…"
          aria-label="Command search"
          className="w-full border-b border-border-tertiary bg-transparent px-4 py-3 text-sm text-content-primary outline-none"
        />
        <ul role="listbox" aria-label="Commands" className="max-h-72 overflow-y-auto py-1">
          {cmdError && (
            <li role="presentation" className="px-4 py-2 text-sm text-error">
              {cmdError}
            </li>
          )}
          {filtered.length === 0 ? (
            <li role="presentation" className="px-4 py-3 text-sm text-content-tertiary">
              No matching commands
            </li>
          ) : (
            filtered.map((cmd, i) => (
              <li key={cmd.id} role="presentation">
                <button
                  type="button"
                  id={`cmd-option-${cmd.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => runCommand(cmd)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                    i === active ? 'bg-background-secondary text-content-primary' : 'text-content-secondary'
                  }`}
                >
                  <span>{cmd.label}</span>
                  {cmd.hint && <span className="text-xs text-content-tertiary">{cmd.hint}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
