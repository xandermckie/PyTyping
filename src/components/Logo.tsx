interface LogoProps {
  /** Mark height/width in px. */
  size?: number;
  /** Show the "pytyping" wordmark next to the mark. */
  wordmark?: boolean;
  className?: string;
}

/**
 * PyTyping mark: a terminal prompt `>` with a blinking-style caret bar — the
 * core motif of the app (a code prompt you type into). The chevron uses
 * currentColor so it inherits text color; the caret uses the theme accent, so
 * the logo re-themes for free.
 */
export default function Logo({ size = 28, wordmark = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="PyTyping logo"
        className="shrink-0"
      >
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="7"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        <path
          d="M10 11 L16 16 L10 21"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="17" y="19.5" width="7" height="2.6" rx="1.3" style={{ fill: 'var(--color-accent)' }} />
      </svg>
      {wordmark && (
        <span className="font-mono text-base font-medium leading-none text-content-primary">
          py<span className="text-accent">typing</span>
        </span>
      )}
    </span>
  );
}
