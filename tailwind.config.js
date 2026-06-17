/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Semantic color tokens map to CSS variables so every class respects the
      // active theme (light / monokia / custom). Never hardcode hex in JSX.
      colors: {
        background: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        accent: 'var(--color-accent)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        border: {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
          tertiary: 'var(--color-border-tertiary)',
        },
      },
      fontFamily: {
        mono: 'var(--font-code)',
        sans: 'var(--font-ui)',
      },
      // Design system: 0.5px borders only (never 1px). Override the default.
      borderWidth: {
        DEFAULT: '0.5px',
        '0.5': '0.5px',
      },
      // Corners: 8px (controls), 12px (cards), full (pills).
      borderRadius: {
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      opacity: {
        8: '0.08',
      },
    },
  },
  plugins: [],
};
