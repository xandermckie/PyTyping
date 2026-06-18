import { APP_VERSION, AUTHOR_NAME, BUY_ME_A_COFFEE_URL, GITHUB_URL, MONKEYTYPE_URL } from '../lib/links';

interface FooterProps {
  /** Faded out (and click-blocked) during focused typing — zen mode. */
  hidden: boolean;
  /** Open the About & legal view. */
  onShowLegal: () => void;
}

const TIPS: Array<{ keys: string; label: string }> = [
  { keys: 'ctrl/⌘ + k', label: 'command line' },
  { keys: 'esc', label: 'menu' },
  { keys: 'tab', label: 'indent' },
];

/**
 * Bottom bar: keyboard hints, credits, and legal links. Fades out (and stops
 * intercepting clicks) while the user is actively typing.
 */
export default function Footer({ hidden, onShowLegal }: FooterProps) {
  return (
    <footer
      className={`px-4 pb-6 pt-4 transition-opacity duration-300 sm:px-6 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-xs text-content-tertiary">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {TIPS.map((t) => (
            <span key={t.keys} className="flex items-center gap-1.5">
              <kbd className="rounded-md border border-border-tertiary bg-background-secondary px-1.5 py-0.5 font-mono text-content-secondary">
                {t.keys}
              </kbd>
              {t.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-tertiary pt-3">
          <span className="font-mono">
            py<span className="text-accent">typing</span> v{APP_VERSION}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            created by{' '}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-secondary underline-offset-2 hover:text-accent hover:underline"
            >
              {AUTHOR_NAME}
            </a>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            inspired by{' '}
            <a
              href={MONKEYTYPE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-secondary underline-offset-2 hover:text-accent hover:underline"
            >
              Monkeytype
            </a>
          </span>
          <button
            type="button"
            onClick={onShowLegal}
            className="text-content-secondary underline-offset-2 hover:text-accent hover:underline"
          >
            About & legal
          </button>
        </div>

        <p className="text-content-secondary">
          Enjoying PyTyping?{' '}
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-content-secondary underline-offset-2 hover:text-accent hover:underline"
          >
            Buy me a coffee
          </a>
          . Optional. Thanks if you want to support development.
        </p>
      </div>
    </footer>
  );
}
