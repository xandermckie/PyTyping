interface FooterProps {
  /** Faded out during focused typing (zen mode). */
  hidden: boolean;
}

const TIPS: Array<{ keys: string; label: string }> = [
  { keys: 'ctrl/⌘ + k', label: 'command line' },
  { keys: 'esc', label: 'menu' },
  { keys: 'ctrl/⌘ + l', label: 'focus typing' },
  { keys: 'tab', label: 'indent' },
];

/**
 * Monkeytype-style bottom bar: keyboard hints + version. Fades out while the
 * user is actively typing so nothing competes with the code.
 */
export default function Footer({ hidden }: FooterProps) {
  return (
    <footer
      className={`pointer-events-none px-4 pb-6 pt-4 transition-opacity duration-300 sm:px-6 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 text-xs text-content-tertiary">
        {TIPS.map((t) => (
          <span key={t.keys} className="flex items-center gap-1.5">
            <kbd className="rounded-md border border-border-tertiary bg-background-secondary px-1.5 py-0.5 font-mono text-content-secondary">
              {t.keys}
            </kbd>
            {t.label}
          </span>
        ))}
        <span className="ml-auto font-mono">
          py<span className="text-accent">typing</span> v0.1.0
        </span>
      </div>
    </footer>
  );
}
