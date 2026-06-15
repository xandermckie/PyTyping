# PyTyping: Project Context

Use this file to quickly brief Claude (or yourself) on the current state of PyTyping. Paste this at the start of any new session where you need context.

---

## Quick Summary

**PyTyping** is a minimalist Python learning game inspired by Monkeytype. Users learn Python by typing actual code snippets character-by-character with real-time keystroke validation, then answer quiz questions and read a breakdown of what they just learned.

---

## Core Philosophy

- **Minimalist**: No distractions. Code is the hero.
- **Keyboard-native**: All interactions work via keyboard.
- **Real-time feedback**: Keystroke validation happens instantly (green=correct, red=incorrect).
- **Learning through doing**: Muscle memory + understanding (typing + quiz + breakdown).
- **Offline-first**: No external APIs for core loop. exercises.json embedded in build.

---

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **Build tool**: Vite
- **Deployment**: Vercel (or Netlify)
- **State management**: useState/useReducer (no Redux for MVP)
- **Data**: exercises.json (static JSON file, loaded at build time)
- **Storage**: LocalStorage (user preferences, progress)

---

## Design System

### Colors (CSS Variables)
```css
--color-background-primary: #F8F7F5 (light) | #0F0E0D (dark)
--color-text-primary: #2C2C2A (light) | #F1F0ED (dark)
--color-text-secondary: muted gray
--color-accent: teal (or user's theme choice)
--color-error: soft red (#E24B4A)
--color-success: soft green (#639922)
--color-border-primary: 0.5px solid borders
```

### Typography
- **Code font**: JetBrains Mono (14px, 1.6 line-height)
- **UI font**: Inter (14px body, 18px headings, 500 weight only)
- **Font weights**: 400 (regular) + 500 (bold) only. Never 600/700.

### Spacing Scale
4px, 8px, 12px, 16px, 24px, 32px

### Corners
8px (subtle) for most elements, 12px for cards only

### Borders
0.5px only (never 1px)

---

## Component Architecture

```
src/
  components/
    TypingInput.tsx          (core: keystroke validation)
    QuizPanel.tsx            (post-code: 3-5 MC questions)
    BreakdownPanel.tsx       (post-quiz: learning explanation)
    ExerciseCard.tsx         (exercise browser)
    Settings.tsx             (theme, font, sound customization)
    ProgressTracker.tsx      (user stats)
  pages/
    Home.tsx                 (landing + exercise selection)
    TypingPage.tsx           (orchestrates: Typing → Quiz → Breakdown)
  types/
    exercise.ts              (Exercise interface)
  data/
    exercises.json           (array of exercises)
  styles/
    globals.css              (CSS variables + base styles)
  App.tsx
  main.tsx
```

---

## Exercise Data Structure

```typescript
interface Exercise {
  id: string;                    // "py-func-fib-001"
  title: string;                 // "Write a Fibonacci Generator"
  description: string;           // Short 1-2 line explanation
  difficulty: "beginner" | "intermediate" | "advanced";
  topics: string[];              // ["generators", "recursion"]
  sourceUrl: string;             // Link to original source
  sourceLabel: string;           // "Real Python"
  estimatedTime: number;         // minutes
  code: string;                  // Full code to type
  explanation: {
    overview: string;
    keyTerms: Array<{ term: string; definition: string }>;
    howItWorks: string;
    designPattern?: string;
    relatedExercises: string[];  // IDs of follow-up exercises
  };
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}
```

---

## Key Design Decisions (Already Made)

### Keystroke Validation: STRICT
- User must type exactly: correct char → green/advance, wrong char → red/no advance
- Tab key → validated as 4 spaces (configurable in settings)
- Indentation: exact match required (Python is whitespace-sensitive)
- This teaches Python's strictness, not forgiving

### Exercise Sources: Curated
Real Python > Official Python docs > Stack Overflow > Original code
(Never random internet code; all sources trusted and vetted)

### Offline First
- exercises.json embedded in bundle
- No API calls in core typing loop
- Progress saved to LocalStorage
- Optional: Firebase for leaderboards (v2+)

### UI Feedback: Instant
- Keystroke validation: <50ms latency
- Stats updates: debounced at 100ms (don't re-render every keystroke)
- Quiz feedback: immediate (green/red checkmark on selection)

---

## Build Order (MVP)

**Week 1-2:**
1. TypingInput (hardest—keystroke validation algorithm)
2. QuizPanel (straightforward—MC logic)
3. BreakdownPanel (text rendering)

**Week 3:**
4. ExerciseCard + Home
5. Settings
6. Progress tracking
7. Integrate all into TypingPage

**Week 4+:**
8. Deploy to Vercel
9. Curate 30+ more exercises
10. v1.0 features (challenge mode, themes, leaderboard)

---

## Code Style Conventions

### Component Structure
```typescript
import React, { useState, useCallback } from 'react';

interface Props {
  // Props documented with types
  code: string;
  onComplete: () => void;
}

export default function ComponentName({ code, onComplete }: Props) {
  // State first
  const [input, setInput] = useState('');
  
  // Callbacks
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Logic
  }, []);
  
  // Render
  return <div>...</div>;
}
```

### CSS / Tailwind
- Use utility classes inline (no separate CSS files)
- Reference CSS variables for colors: `bg-[var(--color-background-secondary)]`
- Mobile-first: design for 375px, then add breakpoints at 768px
- Dark mode: automatically handled by CSS variables

### Comments
- Comment non-obvious algorithms (keystroke validation logic)
- Comment state management decisions
- Comment performance optimizations (React.memo, useCallback)
- Minimal comments on obvious code

### Naming
- Component files: PascalCase (TypingInput.tsx)
- Functions/variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- CSS classes: lowercase-with-hyphens
- Props: camelCase

---

## What's Been Built So Far

- [x] Project scaffold (Vite + React + TS + Tailwind v3, design-system CSS variables)
- [x] TypingInput.tsx (Prism highlighting, strict keystroke validation, desktop + mobile input)
- [x] QuizPanel.tsx
- [x] BreakdownPanel.tsx
- [x] ExerciseCard.tsx
- [x] Settings.tsx (presets + 8-color custom editor, fonts, tab size, sound, line numbers)
- [x] ProgressTracker.tsx
- [x] Home.tsx (browser with difficulty/topic filters)
- [x] TypingPage.tsx (orchestrates Typing → Quiz → Breakdown)
- [x] data/exercises.json (6 curated exercises, beginner → advanced)
- [x] Hardening: ErrorBoundary, runtime data/storage validation, color/import sanitization, production CSP
- [x] Local user profiles (per-profile progress, switcher, rename/delete, validated backup export/import)
- [x] Monkeytype UX: results screen, command palette (Ctrl/⌘+K), zen chrome-fade, tips footer, Esc menu + restart
- [ ] Project deployed to Vercel

*(Update this as you build)*

---

## What's Next

1. Build TypingInput component (start here)
2. Test with first 5 exercises
3. Build QuizPanel
4. Build BreakdownPanel
5. Integrate into TypingPage

---

## How to Use This File

**At the start of a new Claude session:**
```
I'm building PyTyping, a Python learning game. Here's the project context:

[Paste this entire file]

Task: Build [Component Name]
Requirements: [Your specific requirements]
```

This gets Claude up to speed without re-explaining the whole project.

---

## Key Files to Reference

- `PyTyping_System_Prompt.md` — Full project specification
- `PyTyping_Complete_Guide.md` — Design + frameworks
- `PyTyping_Ready_to_Use_Prompts.md` — Copy/paste component prompts
- `.claude-instructions` — Claude's instructions for this project (separate file)

---

## Questions?

Refer to `PyTyping_System_Prompt.md` for full project details, or `PyTyping_Complete_Guide.md` for design decisions and frameworks.
