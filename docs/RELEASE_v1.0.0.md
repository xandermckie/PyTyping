# PyTyping 1.0.0

**PyTyping 1.0 — learn Python by typing real code.**

PyTyping is an offline-first typing trainer: type real Python snippets character by character, answer a short quiz, and read a plain-language breakdown. Version 1.0 adds ghost racing, friends, profile photos, ranks, and IDE-style typing helpers.

---

## Highlights

### Core learning loop
- Hundreds of curated Python exercises with syntax highlighting
- Guided and challenge typing modes
- Post-run quiz and breakdown for each exercise
- Progress, streaks, achievements, and spaced review queue

### Ghost race
- Race built-in CPU opponents (Easy → Extreme + The Creator benchmark)
- Race your own saved replays or imported friend ghosts
- Bronze → Diamond rank system based on peak race WPM
- Race records on the Leaderboard

### Friends & sharing (offline)
- **Friends** page to manage imported opponents
- **Friend codes** (`PYT1:…`) — pasteable compressed strings, no server
- **JSON export** for ghost bundles
- Optional **profile photos** included in friend shares

### Productivity
- Floating **Pomodoro** widget with configurable focus/break lengths and browser notifications
- **Command palette** (`Ctrl/⌘ + K`) for navigation and theme switching
- Multiple themes including custom colors

### IDE-style typing
- Tab inserts spaces; Enter auto-indents the next line
- VS Code-style **delimiter pairing** for `()`, `[]`, `{}`, and quotes on empty pairs

### Data & privacy
- **Local accounts** (no email, no cloud)
- **Backup export/import** (v3) — move all progress, replays, friends, and settings between devices
- Everything stays on your device unless you export it

---

## Offline-first

PyTyping has **no backend**. Accounts, progress, replays, friend imports, and photos are stored in browser storage on your device. Friend codes and JSON files are shared manually (chat, email, etc.).

---

## Install & run

```bash
git clone <your-repo-url>
cd PyTyping
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm test          # unit tests
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

---

## Deploy

Static build output in `dist/`. The Vite config uses `base: '/'` for GitHub Pages user sites. Build and deploy `dist/` to any static host (GitHub Pages, Cloudflare Pages, Netlify, etc.).

---

## Upgrade notes (from 0.x)

- Backup format **v3** includes replays, friend ghosts, race ranks, and optional profile photos. v2 backups still import.
- Friend codes use `lz-string` (bundled in the app build).
- Package version is **1.0.0**.

---

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS
- Prism.js for syntax tokenization
- Vitest for unit tests

---

## Contributing

See the in-app **Contribute** page to request exercises or languages. For bugs and features, open an issue on GitHub.

---

**Full release checklist:** tag `v1.0.0`, create a GitHub Release, and paste this file as the release description.
