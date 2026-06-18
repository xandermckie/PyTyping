import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { getFocusableElements, handleFocusTrapKeyDown } from '../lib/focus-trap';

export interface UseModalA11yOptions {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  /** Element to focus when the modal opens; defaults to first focusable in container. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Restore focus to the element that was active before open. Default true. */
  restoreFocus?: boolean;
  /** Escape key handler; defaults to `onClose`. */
  onEscape?: () => void;
}

/**
 * Modal accessibility: initial focus, focus trap, Escape, and focus restore.
 */
export function useModalA11y({
  open,
  onClose,
  containerRef,
  initialFocusRef,
  restoreFocus = true,
  onEscape,
}: UseModalA11yOptions): void {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const raf = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const first = getFocusableElements(containerRef.current)[0];
      first?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, initialFocusRef, containerRef]);

  useEffect(() => {
    if (open || !restoreFocus) return;
    returnFocusRef.current?.focus();
  }, [open, restoreFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        (onEscape ?? onClose)();
        return;
      }
      if (event.key === 'Tab' && containerRef.current) {
        handleFocusTrapKeyDown(event, containerRef.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, onEscape, containerRef]);
}
