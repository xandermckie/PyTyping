# PyTyping: Python Learning Game System Prompt

*A minimalist, Monkeytype-inspired typing game where users learn Python by typing actual code.*

---

## PROJECT UNDERSTANDING

**Goal**: Build an interactive web application that teaches Python programming through typed code exercises, similar to Monkeytype's typing test interface but with code snippets ranging from simple functions to complete programs.

**Target Audience**: CS students (beginner through advanced) and engineers brushing up on Python skills. Supports difficulty tiers: beginner (variables, loops, functions), intermediate (classes, decorators, async), advanced (design patterns, optimization).

**Tech Stack**: 
- Frontend: React + TypeScript (Vite)
- Styling: Tailwind CSS with custom theme system
- Code Source: Mix of official docs (Real Python, Python.org) + trusted sources (Stack Overflow curated snippets)
- Storage: LocalStorage for user progress/preferences, optional Firebase for leaderboards

**Deliverable**: A fully functional web app accessible at a deployment URL (Vercel/Netlify) with:
- Typing mode (guided code exercises with real-time feedback)
- Challenge mode (build from scratch with hints)
- Quiz mode (multiple-choice questions post-exercise)
- Theme/font customization
- Leaderboard (optional, v2+)
- Progress tracking

**Timeline**: MVP in 2-3 weeks (typing mode + basic quiz), v1.0 with all modes in 4-5 weeks

**Must-haves**:
- Real-time keystroke validation (syntax highlighting, error marking)
- Code explanation panel (breakdown of new functions, libraries, terminology)
- Smooth, distraction-free UI (Monkeytype aesthetic)
- Mobile-responsive (typing is keyboard-first, but should work on tablets)
- No external API dependencies for core functionality

---

## DESIGN PHILOSOPHY

**Aesthetic Direction**: Minimalist, intentional, focused. Inspired by Monkeytype:
- Large, readable code (typography matters)
- Uncluttered interface (hide what's not needed in the moment)
- Smooth animations (not flashy—purposeful motion only)
- Dark/light themes with CSS variables
- Custom fonts (Monospace for code, clean sans-serif for UI)

**Key UX Principles**:
1. **Type to learn, not type to test.** The goal is *absorption* via muscle memory + immediate feedback, not speed records. Accuracy matters more than WPM.
2. **Show the code, let them type it.** The user sees a syntax-highlighted code block, types it out character by character, gets real-time feedback on mistakes, and corrects on the fly.
3. **Learning stacks on practice.** After each exercise: a quiz validates understanding, then a breakdown explains what they just typed (new functions, libraries, design patterns, terminology).
4. **Progression feels natural.** Difficulty curves smoothly. Beginner exercises use familiar Python (variables, if/else). Intermediate adds patterns (classes, list comprehensions). Advanced shows real-world code (decorators, async/await, type hints).

---

## FEATURE SET: MVP (Typing Mode + Quiz + Breakdown)

### 1. **Typing Mode** (Core Loop)
User sees:
- **Exercise Info Bar**: Difficulty badge (Beginner/Intermediate/Advanced), code source tag (e.g. "Real Python"), topic tag (e.g. "Functions")
- **Code Block**: Syntax-highlighted Python code to type (12-50 lines depending on difficulty)
- **Input Field**: Full-width, monospace. Real-time character validation:
  - Correct char: highlight green, move to next
  - Wrong char: highlight red, do NOT advance (user must correct)
  - Whitespace/indentation: strict matching (tabs vs spaces matter in Python!)
- **Live Stats**: WPM (optional), Accuracy %, Errors (real-time update)
- **Progress Bar**: Visual indicator of how far through the code they are

**Feedback**:
- Correct keystroke: subtle visual cue (slight fade or pulse)
- Wrong keystroke: audible ding (muted by default, toggle in settings)
- Completion: celebratory animation (confetti optional, default off)

**Success State**:
- User types final character → code is 100% correct
- Transition to Quiz Mode (auto or with a "Next" button)

---

### 2. **Quiz Mode** (Post-Exercise)
3-5 multiple-choice questions testing comprehension of what they just typed:
- *What is this function's purpose?*
- *What does this method return?*
- *Which library is this from?*
- *What would happen if we changed this parameter?*

**Mechanics**:
- Click to select answer
- Immediate feedback: green checkmark or red X
- Show the correct answer with a brief explanation
- Progress to Breakdown

**Scoring**: Not gamified (no points), but tracked (correctness shown in progress panel)

---

### 3. **Breakdown Mode** (Learning Panel)
After quiz, show a structured breakdown of the code:

**Sections**:
1. **Overview** (2-3 sentences): What does this code do? Real-world use case?
2. **Key Concepts** (bulleted list):
   - New terminology (e.g., "list comprehension", "decorator", "async/await")
   - New functions/methods used (with one-liner definitions)
   - New libraries imported (with brief context)
3. **How It Works** (step-by-step):
   - Annotated pseudo-code or narrative walk-through
   - Highlight key lines with explanations
4. **Design Pattern** (if applicable):
   - Name the pattern (e.g., "Factory Pattern", "Callback", "Context Manager")
   - Show where it appears in the code
5. **Related Exercises**: Suggest 2-3 follow-up exercises that build on this concept

**Tone**: Educational but not condescending. Explain *why* code is written this way, not just what it does.

---

### 4. **Exercise Selection** (Home/Browse)
User lands on a dashboard with filtering:
- **Difficulty**: Beginner / Intermediate / Advanced (button toggles, default "All")
- **Topic**: Functions, OOP, Data Structures, Async, Type Hints, etc. (tag buttons)
- **Source**: Real Python, Python Docs, Stack Overflow, etc. (optional filter)
- **Recent**: "Continue" button if they have incomplete exercises

**Card Display**:
Each exercise card shows:
- Title (e.g., "Write a Fibonacci Generator")
- Difficulty badge
- Topic tags
- Source link (optional)
- Preview of first 2 lines of code (for context)
- Estimated time (e.g., "3 min")

**Clicking a card** → loads Typing Mode

---

### 5. **Settings & Customization**

**Theme**:
- Preset themes (Dark, Light, and 3-4 community-designed themes inspired by Monkeytype)
- Custom theme editor:
  - Background color
  - Text color (primary, secondary, error)
  - Accent color (for highlights, UI elements)
  - Caret color
  - Code highlight colors (syntax coloring)

**Fonts**:
- Code font: Monospace dropdown (JetBrains Mono, Courier New, Fira Code, etc.)
- UI font: Sans dropdown (Inter, Roboto, etc.)
- Size: 12px–18px (default 14px)
- Line height: 1.5–2.0 (default 1.6)

**Behavior**:
- Sound effects (on/off toggle)
- Instant feedback (typed char = instant validation vs require key release)
- Theme auto-switch (system preference)
- Show hints in challenge mode (on/off)

**Progress**:
- Personal stats: Exercises completed, total time spent, topics mastered
- Export progress as JSON (for backup or sharing)

---

## EXERCISE DATA STRUCTURE

```typescript
interface Exercise {
  id: string;                    // "py-func-fib-001"
  title: string;                 // "Write a Fibonacci Generator"
  description: string;           // Short 1-2 line explanation
  difficulty: "beginner" | "intermediate" | "advanced";
  topics: string[];              // ["generators", "recursion", "performance"]
  sourceUrl: string;             // Link to original source
  sourceLabel: string;           // "Real Python"
  estimatedTime: number;         // minutes
  code: string;                  // Full code to type
  explanation: {
    overview: string;
    keyTerms: Array<{ term: string; definition: string }>;
    howItWorks: string;           // Step-by-step or narrative
    designPattern?: string;
    relatedExercises: string[];   // IDs of follow-up exercises
  };
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;          // Why this is correct
  }>;
}
```

**Data Storage**: JSON file (exercises.json) checked into the repo, loaded at build time. Future: database if user-submitted exercises are added.

---

## MONKEYTYPE UI INSPIRATION

Key elements to replicate/adapt:

1. **Spacious, elegant layout**: Code centered, stats below
2. **Real-time stats bar**: WPM, Accuracy, Time, Errors (all live-updating)
3. **Smooth caret**: Animated blinking cursor, optional smooth mode
4. **Focus mode**: Full-screen, minimal UI, no distractions
5. **Theme system**: CSS variables, instant theme switching, community themes
6. **Keyboard-first**: Mouse is optional; spacebar restarts, Esc closes modals
7. **Typography matters**: Monospace code is beautiful and readable

---

## TECH IMPLEMENTATION NOTES

**Keystroke Validation**:
- Compare user input char-by-char against the code
- Handle tabs: user presses Tab → validate as spaces (or actual tab, user's choice)
- Newlines: Enter key → validate as \n
- Indentation: Leading whitespace must match exactly

**Syntax Highlighting**:
- Use Prism.js or highlight.js for syntax coloring (Python lexer)
- Apply theme colors from CSS variables
- Keep it subtle (not rainbow-bright)

**Real-time Feedback**:
- Debounce input events (100ms) to avoid performance issues
- Store user's typed chars in state
- Compare line-by-line for accuracy calculation
- Update stats every keystroke

**Mobile Responsiveness**:
- Code blocks scale down on mobile but remain readable
- Stats bar adapts to single row or stacked layout
- Touch-friendly buttons (48px min hit target)
- Optional on-screen keyboard for soft keyboards (non-essential for MVP)

---

## FUTURE FEATURES (Post-MVP)

1. **Challenge Mode**: "Build this from scratch" with skeleton code, no reference
2. **Leaderboards**: Global/friend WPM/accuracy rankings (requires backend)
3. **Spaced Repetition**: Suggest exercises user struggled with after 3 days
4. **Video Explanations**: Embedded YouTube videos for complex patterns
5. **Multiplayer Racing**: Type the same code simultaneously (websocket-based)
6. **Community Exercises**: User-submitted code with peer review
7. **Analytics Dashboard**: Heatmaps of topics mastered, weak areas
8. **Achievements/Badges**: Milestone rewards (first 10 exercises, no errors, etc.)
9. **Exports**: Share a completed exercise on social media with a screenshot
10. **Integration**: Embed PyTyping exercises in coding tutorials/blogs

---

## SUCCESS CRITERIA (v1.0)

- [ ] MVP (typing + quiz + breakdown) fully functional
- [ ] 50+ exercises spanning beginner–advanced
- [ ] <100ms keystroke latency (feel responsive)
- [ ] Mobile-responsive (iOS Safari, Chrome Android)
- [ ] Theme system working (≥5 themes)
- [ ] 95%+ Lighthouse score
- [ ] Deployed and publicly accessible
- [ ] <5 min onboarding for new users
- [ ] Zero external API calls for core loop (offline-capable)

---

## CONSTRAINTS & ASSUMPTIONS

- **Keyboard-first**: Mouse is secondary. All interactions must work via keyboard.
- **No external APIs**: Core typing loop is 100% client-side. Optional leaderboards use Firebase (v2+).
- **Offline mode**: Exercises are cached locally; no internet required for typing.
- **Browser compatibility**: Modern browsers only (ES2020+, CSS Grid, CSS Variables).
- **Code sources**: All exercises are from public, CC/MIT-licensed sources or original. No copyrighted tutorials.
- **No AI generation**: Exercises are human-written or sourced from trusted Python educators.
- **Privacy**: No telemetry, no ads, no tracking. Progress stored in LocalStorage (user's browser only).

---

## PROMPT STRUCTURE FOR CLAUDE CODE

When building with Claude Code, use this prompt structure for each component:

```
You are building PyTyping, a minimalist Python learning game inspired by Monkeytype.

[Relevant design philosophy from above]

Task: Build [specific component: Typing Input, Quiz Panel, Breakdown Display, Exercise Browser, etc.]

Requirements:
- [List of specific requirements]

Design Constraints:
- Monospace code in exercises, clean sans-serif for UI
- Theme system uses CSS variables (--color-*, --font-*, --size-*)
- Mobile responsive (breakpoint at 768px)
- Keyboard-accessible (Tab, Enter, Esc all work)
- No external libraries except React + Tailwind (state management via useState/useReducer)

Output:
- React component (functional, TypeScript)
- Props interface clearly defined
- CSS/Tailwind classes inline
- Comments for non-obvious logic
- Ready to integrate into the main app

[Include relevant data structures and examples if needed]
```

---

## EXERCISE CURATION GUIDELINES

**Sources** (in priority order):
1. **Python Official Docs** (python.org tutorials, examples)
2. **Real Python** (Medium-length tutorials, always beginner-friendly)
3. **Automate the Boring Stuff with Python** (Chapter snippets)
4. **Stack Overflow Popular Answers** (Curated high-vote snippets, syntax-only)
5. **Original compositions** (Simple, educational, no external dependencies)

**Avoid**:
- Exercises requiring external libraries (requests, pandas, Flask) for now
- Code that's overly clever or hard to read
- Snippets without clear learning objective
- Code longer than ~50 lines (too much to type)

**Curation Process**:
1. Find or write code
2. Extract the core snippet (5–50 lines)
3. Write 3-5 quiz questions
4. Write breakdown (4-5 sections)
5. Tag difficulty + topics
6. Test by typing it yourself (check indentation edge cases)

---

## ANALOGY FOR LEARNING DESIGNERS

**PyTyping is to Python programming what Monkeytype is to typing.** You don't learn to type by reading about the keyboard; you learn by typing. Similarly, you don't learn Python by reading about functions; you learn by typing functions. Each exercise is designed to:
- **Show** correct syntax (what a proper function definition looks like)
- **Enforce** accuracy (you must type it exactly)
- **Explain** why (breakdown tells you what you just typed and why it matters)
- **Build** intuition (quiz tests your understanding of the *why*, not just the *what*)

---

## NEXT STEPS (Before Development)

1. **Finalize exercise set**: Curate 50+ exercises (beginner–advanced) and structure as exercises.json
2. **Design system**: Create Tailwind config + theme CSS variables
3. **Component architecture**: Outline React component hierarchy (App → Pages → Components)
4. **Keystroke handler**: Write a pure function to validate typed code vs source code
5. **Data flow**: Document Redux/Zustand store shape (or useState approach for MVP)

---

**Final Thought**: This game teaches Python *through doing*, not through passively reading. Every keystroke is a chance to learn, and every exercise is a small win toward deeper understanding. The interface should fade away—all that matters is the code, the feedback, and the learning.
