# Accessibility (PyTyping v1.0)

PyTyping targets **WCAG 2.1 Level AA**. This doc lists what is built in and how to check before a release.

---

## Built-in support

| Area | What we do |
|------|------------|
| **Keyboard** | Full app navigation; command palette (`Ctrl/⌘ + K`); quiz arrow keys; typing shortcuts (`Tab`, `Esc`, `Ctrl/⌘ + L`) |
| **Focus** | Visible `:focus-visible` rings; skip link to main content; modal focus trap + restore (`useModalA11y`) |
| **Screen readers** | ARIA on dialogs, progress bars, and quiz options; typing live region for correct/incorrect feedback; code description via `aria-describedby` |
| **Motion** | `prefers-reduced-motion` disables caret blink and transitions; steady caret option in Settings |
| **Contrast & text** | Semantic color tokens; tertiary text tuned for AA; minimum 13px code font on small screens |
| **Modes** | **Guided**: full code for assistive tech. **Challenge**: structure hint only; use Guided for full code |

Modals with focus trapping: command palette, pause menu, profile photo crop, share ghost, header/mobile menus.

---

## Known limitations

- **Challenge mode** hides untyped characters on screen. Use **Guided** mode or the structure hint with a screen reader.
- The highlighted code panel is decorative (`aria-hidden`). Input and announcements carry typing state.
- Optional **Google Fonts** load from the network when selected in Settings (see About & legal → Privacy).

---

## Pre-release checklist

1. **Keyboard only**: Tab through Home → exercise → quiz → breakdown → Settings → Friends without a mouse.
2. **Skip link**: Tab once from page load; “Skip to main content” moves focus to `<main>`.
3. **Command palette**: Open with `Ctrl/⌘ + K`; arrow keys + Enter run a command; Esc closes and restores focus.
4. **Typing (Guided)**: Start an exercise; confirm live announcements on wrong/right keys; Esc pause menu traps focus.
5. **Typing (Challenge)**: Confirm structure hint is available; switch to Guided if you need full code.
6. **Quiz**: Arrow keys move options; Enter selects; progress bar says “question X of Y”.
7. **Modals**: Crop photo, share ghost, mobile nav: Tab stays inside; Esc closes; focus returns to trigger.
8. **Reduced motion**: With OS reduce motion on: no caret blink; no harsh transitions.
9. **Automated scan**: Run Lighthouse accessibility and axe DevTools on Home, Typing, Settings; fix critical/serious issues.

Target: no critical axe violations; Lighthouse accessibility score ≥ 90 on core pages.

---

## Reporting issues

File a GitHub issue with **“accessibility”** in the title or body:

[Bug report template](https://github.com/xandermckie/xandermckie.github.io/issues/new?template=bug-report.yml)

Include: browser + OS, assistive technology (if any), steps to reproduce, and expected vs actual behavior.
