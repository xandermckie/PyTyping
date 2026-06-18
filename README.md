# PyTyping

Learn Python by typing real code — with instant feedback, quizzes, ghost racing, and offline friend sharing.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](#)

---

## Features

- **Typing exercises** — real Python snippets with syntax highlighting, guided/challenge modes, quiz + breakdown
- **Ghost race** — built-in CPU tiers, your replays, friend imports; Bronze → Diamond ranks
- **Friends** — friend codes (`PYT1:…`), JSON share, profile photos; fully offline
- **Leaderboard** — overall progress and race records
- **Pomodoro** — focus/break timer with optional browser notifications
- **Local accounts & backup** — no server; export/import v3 backup to move data
- **IDE-style typing** — Tab, auto-indent, VS Code delimiter pairing
- **Command palette** — `Ctrl/⌘ + K` for navigation and themes

Everything runs in the browser. Your data stays on your device unless you export it.

---

## Quick start

```bash
npm install
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run typecheck` | TypeScript check |

---

## Release notes

See [docs/RELEASE_v1.0.0.md](docs/RELEASE_v1.0.0.md) for the full v1.0 changelog and GitHub Release text.

To tag a release:

```bash
git tag -a v1.0.0 -m "PyTyping 1.0.0 — first stable release"
git push origin v1.0.0
```

---

## Deploy

Build with `npm run build` and deploy the `dist/` folder to any static host. Configured for root hosting (`base: '/'` in Vite — suitable for GitHub Pages user sites).

---

## Tech stack

React · TypeScript · Vite · Tailwind CSS · Prism.js · Vitest

---

## Project docs

Additional planning and design documents may live in the repo root (`CONTEXT.md`, guides, etc.). The shipped app source is under `src/`.

---

## License

See repository license file. Exercise content is for educational use.
