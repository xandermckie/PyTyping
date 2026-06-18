import type { ReactNode } from 'react';

interface CodePeekPanelProps {
  open: boolean;
  onToggle: () => void;
  openLabel?: string;
  closedLabel?: string;
  children: ReactNode;
}

/** Collapsible panel for peeking at code without leaving the current step. */
export default function CodePeekPanel({
  open,
  onToggle,
  openLabel = 'Hide code',
  closedLabel = 'Show code',
  children,
}: CodePeekPanelProps) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex items-center gap-1.5 text-xs text-content-tertiary transition-colors hover:text-content-secondary"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {open ? openLabel : closedLabel}
      </button>
      {open && children}
    </div>
  );
}
