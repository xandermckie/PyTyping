import { useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

interface DisclosurePanelProps {
  open: boolean;
  onClose: () => void;
  /** Element to restore focus to when the panel closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** First focusable element inside the panel (focused on open). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  panelClassName?: string;
  /** Accessible name when the panel has no visible title. */
  ariaLabel?: string;
}

/**
 * Backdrop + panel shell for dropdowns and mobile menus.
 * Handles Escape, backdrop dismiss, and focus restore.
 */
export default function DisclosurePanel({
  open,
  onClose,
  returnFocusRef,
  initialFocusRef,
  children,
  panelClassName = '',
  ariaLabel,
}: DisclosurePanelProps) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useModalA11y({
    open,
    onClose,
    containerRef: panelRef,
    initialFocusRef: initialFocusRef as RefObject<HTMLElement | null> | undefined,
    restoreFocus: Boolean(returnFocusRef),
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={panelClassName}
      >
        {children}
      </div>
    </>
  );
}
