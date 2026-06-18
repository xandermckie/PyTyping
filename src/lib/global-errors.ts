/**
 * Production-safe global error listeners. Logs sanitized messages without
 * surfacing stack traces or internal paths to end users.
 */

function sanitizeReason(reason: unknown): string {
  if (reason instanceof Error) return reason.message || 'Unknown error';
  if (typeof reason === 'string') return reason.slice(0, 200);
  return 'Unknown error';
}

/** @internal Exported for unit tests. */
export const _sanitizeReasonForTests = sanitizeReason;

export function registerGlobalErrorHandlers(): () => void {
  const onRejection = (e: PromiseRejectionEvent) => {
    e.preventDefault();
    const msg = sanitizeReason(e.reason);
    if (import.meta.env.DEV) {
      console.error('[PyTyping] Unhandled rejection:', e.reason);
    } else {
      console.error('[PyTyping] Unhandled rejection:', msg);
    }
  };

  const onError = (e: ErrorEvent) => {
    const msg = sanitizeReason(e.error ?? e.message);
    if (import.meta.env.DEV) {
      console.error('[PyTyping] Uncaught error:', e.error ?? e.message);
    } else {
      console.error('[PyTyping] Uncaught error:', msg);
    }
  };

  window.addEventListener('unhandledrejection', onRejection);
  window.addEventListener('error', onError);
  return () => {
    window.removeEventListener('unhandledrejection', onRejection);
    window.removeEventListener('error', onError);
  };
}
