import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Inject a Content-Security-Policy meta tag into the built index.html.
 * Build-only: the Vite dev server needs inline module scripts for HMR, so we
 * don't constrain script-src in development. 'unsafe-inline' is allowed for
 * styles only (we set inline CSS variables and Tailwind injects a stylesheet);
 * scripts are restricted to same-origin, blocking injected/3rd-party JS.
 */
function cspPlugin(): Plugin {
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "font-src 'self' https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self'",
    "connect-src 'self'",
    "form-action 'none'",
  ].join('; ');

  return {
    name: 'pytyping-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`,
      );
    },
  };
}

// exercises.json is imported as a module so it is embedded in the build
// (offline-first, no runtime fetch).
export default defineConfig({
  plugins: [react(), cspPlugin()],
});
