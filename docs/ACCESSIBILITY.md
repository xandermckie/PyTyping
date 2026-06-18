# Accessibility (PyTyping v1.0)

PyTyping is designed to meet **WCAG 2.1 Level AA**. This doc summarizes what is built in and how to verify before a release.

---

## Built-in support

| Area | What we do |
|------|------------|
| **Keyboard** | Full app navigation; command palette (`Ctrl/⌘ + K`); quiz arrow keys; typing shortcuts (`Tab`, `Esc`, `Ctrl/⌘ + L`) |
| **Focus** | Visible `:focus-visible` rings; skip link to main content; modal focus trap + restore (`useModalA11y`) |
| **Screen readers** | ARIA on dialogs, progress bars, and quiz options; typing live region for correct/incorrect feedback; code description via `aria-describedby` |
| **Motion** | `prefers-reduced-motion` disables caret blink and transitions; steady caret option in Settings |
| **Contrast & text** | Semantic color tokens; tertiary text tuned for AA; minimum 13px code font on small screens |
| **Modes** | **Guided** — full code exposed to assistive tech. **Challenge** — structure hint only; switch to Guided for full visibility |

Modals with focus trapping: command palette, pause menu, profile photo crop, share ghost, header/mobile menus.

---

## Known limitations

- **Challenge mode** hides untyped characters visually. Screen-reader users should use **Guided** mode or the challenge structure hint.
- The highlighted code panel is decorative (`aria-hidden`); input and announcements carry typing state.
- Optional **Google Fonts** load from the network when selected in Settings (see About & legal → Privacy).

---

## Pre-release checklist

Run these manually before tagging a release:

1. **Keyboard only** — Tab through Home → exercise → quiz → breakdown → Settings → Friends without a mouse.
2. **Skip link** — Tab once from page load; “Skip to main content” moves focus to `<main>`.
3. **Command palette** — Open with `Ctrl/⌘ + K`; arrow keys + Enter run a command; Esc closes and restores focus.
4. **Typing (Guided)** — Start an exercise; confirm live announcements on wrong/right keys; Esc pause menu traps focus.
5. **Typing (Challenge)** — Confirm structure hint is available; toggle to Guided if full code is needed.
6. **Quiz** — Arrow keys move options; Enter selects; progress bar exposes “question X of Y”.
7. **Modals** — Crop photo, share ghost, mobile nav: Tab stays inside; Esc closes; focus returns to trigger.
8. **Reduced motion** — OS “reduce motion” on: no caret blink; no jarring transitions.
9. **Automated scan** — Run Lighthouse accessibility and axe DevTools on Home, Typing, Settings; fix any new critical/serious issues.

Target: no critical axe violations; Lighthouse accessibility score ≥ 90 on core pages.

---

## Reporting issues

File a GitHub issue with **“accessibility”** in the title or body:

[Bug report template](https://github.com/xandermckie/xandermckie.github.io/issues/new?template=bug-report.yml)

Include: browser + OS, assistive technology (if any), steps to reproduce, and expected vs actual behavior.
