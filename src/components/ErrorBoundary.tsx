import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { clearAllData } from '../lib/profiles';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render/runtime errors anywhere below it so a single bad component
 * can't white-screen the whole app. Offers a reload, and a last-resort
 * "reset data" that clears localStorage (in case corrupted storage is the
 * cause) before reloading.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real deployment this is where you'd report to an error service.
    if (import.meta.env.DEV) console.error('[PyTyping] Uncaught error:', error, info);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private handleReset = () => {
    try {
      clearAllData();
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border-secondary bg-background-secondary p-6 text-center">
          <h1 className="text-lg font-medium text-content-primary">Something went wrong</h1>
          <p className="mt-2 text-sm text-content-secondary">
            PyTyping hit an unexpected error. Reloading usually fixes it. If it keeps happening,
            resetting your local data may help.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-background-tertiary"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-secondary hover:bg-background-tertiary"
            >
              Reset data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
