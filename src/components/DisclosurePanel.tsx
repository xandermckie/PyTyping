import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';

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
  const hadFocusRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    hadFocusRef.current = true;
    const id = requestAnimationFrame(() => initialFocusRef?.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (open || !hadFocusRef.current) return;
    returnFocusRef?.current?.focus();
  }, [open, returnFocusRef]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />
      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={panelClassName}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </>
  );
}
