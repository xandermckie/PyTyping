# PyTyping: Complete Project Guide
## Synthesizing Prompt Engineering, Structural Design, UI/UX, and Decision Frameworks

---

## I. PROMPT ENGINEERING: THE 6-ELEMENT FRAMEWORK

### When Building with Claude Code, Use This Structure

Every Claude Code request should follow this pattern for maximum clarity and output quality:

#### **1. ROLE**
Who should Claude be when building this?
```
You are building PyTyping, a minimalist Python learning game. 
You have expertise in:
- Interactive typing UIs (think Monkeytype)
- Educational software design (clear explanations, progressive difficulty)
- React component architecture (state, performance)
- Accessibility (WCAG 2.1 AA minimum)
```

#### **2. CONTEXT**
What does Claude need to know to build this well?
```
PyTyping teaches Python by having users TYPE actual code.
- Target: CS students (you) + engineers brushing up skills
- Core loop: See code → Type it → Get real-time feedback → Take quiz → Learn breakdown
- Inspiration: Monkeytype (minimalist, beautiful, responsive)
- Tech: React, TypeScript, Tailwind CSS, Vite
- No external APIs for core functionality (offline-first)
- All exercises sourced from Real Python, official docs, Stack Overflow (curated)
```

#### **3. TASK**
What exactly should Claude do? Be explicit with the verb:
```
Build [Component Name] that:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]

The component should:
- Integrate with existing [Exercise, Quiz, Breakdown] systems
- Accept props: [list them]
- Emit events/state updates: [list them]
```

#### **4. OUTPUT FORMAT**
What should the deliverable look like?
```
A React functional component (TypeScript) that:
- Includes the component interface (props, state)
- Has 100+ lines of logic with comments on non-obvious parts
- Uses Tailwind CSS utility classes inline (no separate CSS file)
- Exports as default, ready to import into App.tsx

Include:
- Clear prop types and return type
- Any helper functions needed
- Comments on the keystroke validation logic / quiz mechanics / etc.

DO NOT include:
- Dummy data (we have exercises.json)
- npm installations (we're using Vite)
- Build scripts or config changes
```

#### **5. CONSTRAINTS**
What limits or preferences guide the build?
```
- MOBILE-FIRST: UI must work on phones/tablets (breakpoint at 768px)
- KEYBOARD-ACCESSIBLE: All interactions work via keyboard (Tab, Enter, Esc)
- NO DARK MODE GUESSING: Use only CSS variables from design system
- MONOSPACE CODE: Use font-family: monospace for code displays, readable sans for UI
- PERFORMANCE: React.memo() for big lists, useCallback() for event handlers
- TONE: Minimalist, zero distractions. Every pixel earns its place.
```

#### **6. EXAMPLES**
Show Claude what success looks like
```
Example keystroke validation:
- User presses 'd' when code shows 'd' → green highlight, advance
- User presses 'x' when code shows 'd' → red highlight, NO advance
- User must correct before moving forward

Example quiz question:
- Question: "What does this function return?"
- Options: [A) None, B) A tuple, C) A string, D) An integer]
- Correct answer highlighted post-selection with brief explanation

Example breakdown section:
- Title: "What You Just Learned"
- Subsections: Key Terms (definitions), How It Works (narrative), Design Pattern (if applicable)
```

---

## II. GRILL-ME: STRUCTURAL DECISIONS (Already Made)

Before building, we've clarified these critical questions:

### **Goals & Success**
- ✅ **What**: Teach Python through muscle memory + immediate feedback (typing-based learning)
- ✅ **How**: See code → Type → Get real-time validation → Quiz → Learn breakdown
- ✅ **For whom**: CS students (beginner to advanced), engineers brushing up
- ✅ **Done when**: MVP with 50+ exercises in 3-4 weeks; full v1.0 in 5-6 weeks

### **Scope & Boundaries**
- ✅ **In scope**: Typing mode, quiz, breakdown, settings, progress tracking
- ✅ **Out of scope (v2+)**: Multiplayer, advanced analytics, video lessons, community submissions
- ✅ **Tech stack**: React + TypeScript, Tailwind CSS, Vite, LocalStorage (no backend needed for MVP)
- ✅ **Non-negotiables**: Offline-capable, zero external APIs for typing loop, keyboard-first UI

### **Exercise Curation**
- ✅ **Sources**: Real Python > Official Python docs > Stack Overflow > Original code
- ✅ **Range**: Simple variables/loops (beginner) → Classes/decorators (intermediate) → Async/design patterns (advanced)
- ✅ **Quality bar**: Every exercise must teach something, have a clear quiz, and a breakdown

### **Architecture**
- ✅ **Frontend**: Single-page React app (Vite)
- ✅ **Styling**: Tailwind CSS with custom theme system (CSS variables)
- ✅ **State management**: useState/useReducer (no Redux for MVP)
- ✅ **Data**: exercises.json loaded at build time (no dynamic API)

### **What We Know We DON'T Know Yet**
- Should exercises auto-progress or require a "Next" button? (→ Test with first 5 exercises)
- Optimal code block size? (→ Limit to 50 lines max, split longer exercises)
- Should typos play sound by default or require opt-in? (→ Default off, toggle in settings)

---

## III. DECISION-COUNCIL: STRATEGIC TRADE-OFFS RESOLVED

### **Decision: "Monkeytype-like aesthetics OR educational focus?"**

**The 5 Perspectives:**

1. **The Minimalist** (Aesthetic Lead): "Keep the UI invisible. Code is the content. Distractions kill learning."
   - Force: No animations except progress bar. No celebratory effects. No color gradients. Whitespace is generous.

2. **The Educator** (Learning Scientist): "Clarity and feedback are everything. Users need to see their mistakes immediately."
   - Force: Real-time keystroke validation (no delay). Clear error marking. Breakdown panel visible after quiz (not optional).

3. **The Engineer** (Technical Feasibility): "Offline + no backend = simpler, faster, more reliable."
   - Force: exercises.json embedded in build. LocalStorage for progress. No API calls in critical path.

4. **The Pragmatist** (MVP Reality): "Shipped > Perfect. Get 50 exercises and one full loop working. Polish after."
   - Force: One theme for MVP (add 4+ in v1.1). Keyboard-only (mouse support is bonus). Quiz always 5 questions (not smart-adapted).

5. **The User Advocate** (CS Student Perspective): "I'm learning, not competing. Make it feel like a tool I want to use daily."
   - Force: Progress tracking visible (you've completed 23 exercises, mastered functions). No leaderboard pressure. Difficulty matches skill level.

**Resolution**: All 5 perspectives are honored. The design is Monkeytype's minimalism + real-time feedback + offline robustness + educational clarity + daily-use motivation.

### **Decision: "Strict keystroke matching OR forgiving typo correction?"**

**Trade-off**: Strict (what we chose)
- User types 'd' when it should be 'd' → green, advance
- User types ' ' (space) when it should be ' ' (space) → exact match required
- User types '\t' (tab) when it should be '    ' (4 spaces) → FAIL until corrected

**Why**: 
- Python is whitespace-sensitive; students MUST learn this
- Strict mode reinforces accurate typing (educational goal)
- Instant failure teaches error-correction (metacognitive skill)
- Monkeytype is strict; users expect it

**Trade-off cost**: Frustration spikes for indentation errors. Mitigation: Help text in settings ("Pro tip: Check your indentation").

---

## IV. UI/UX & NON-AI UI: DESIGN SYSTEM

### **Design Philosophy**

> "PyTyping is invisible. The code is the hero. The interface serves the code, never competes with it."

**Visual Principles**:
1. **Flat**: No gradients, shadows, glow, or decorative effects (except functional focus rings)
2. **Spacious**: Generous whitespace around code. Stats below, not cluttering
3. **Monospace-first**: The code block dominates. Everything else scales around it
4. **Keyboard-native**: Every interaction possible via keyboard (Tab, Enter, Esc, Space)
5. **Focus-friendly**: Distraction-free mode available (hide nav, full-screen typing)

### **Aesthetic Direction (Not AI-Generated Defaults)**

**Typography**:
- **Code**: JetBrains Mono (default), fallback to Courier New. 14px, 1.6 line-height.
- **UI**: Inter (default), fallback to system sans. 14px body, 18px headings (500 weight only, no 600/700).
- **Intentional choice**: Not Roboto (corporate). Not default system fonts (generic). JetBrains Mono feels like a real developer tool.

**Color Palette** (CSS variables, supports light/dark):
- **Background**: Off-white (#F8F7F5) dark mode → Near-black (#0F0E0D)
- **Text**: Deep charcoal (#2C2C2A) light mode → Off-white (#F1F0ED) dark mode
- **Code highlight**: Syntax colors from a curated palette (not neon/rainbow)
- **Accent**: Single color per theme (teal, amber, purple) for interactive elements
- **Error**: Soft red (#E24B4A), not harsh neon
- **Success**: Soft green (#639922), not bright lime

**Spacing Scale** (Designed, not default):
- 4px (tight), 8px (controls), 12px (component gaps), 16px (section separation), 24px (major sections), 32px (page padding)

**Border & Corners**:
- All borders: 0.5px (thin, refined)
- All corners: 8px (subtle) or 12px (cards only)
- Never 1px or 16px

**Components** (Pre-designed, not Tailwind defaults):
- **Input field**: 36px tall, monospace, 0.5px border, light gray bg, dark on focus
- **Button**: Minimal (transparent bg, 0.5px border), hover → light gray bg, active → 98% scale
- **Select/dropdown**: Same as input, with chevron icon
- **Range slider**: 4px track, 18px thumb, blue accent on track when in use
- **Text area**: Code display (syntax highlighted), not user-editable during typing mode

### **Theme System (Extensible, User-Customizable)**

**Preset Themes** (shipping with MVP):
1. "Monokia" (dark, muted amber accent) — inspired by Monkeytype's dark mode
2. "Light" (light, teal accent) — clean, bright, high contrast
3. (+ 2 more community designs in v1.1)

**Custom Theme Editor** (Settings page):
- 8 color inputs (background, text-primary, text-secondary, accent, error, success, warning, border)
- Live preview on the right (shows sample code block + UI)
- Export/import as JSON (users can share themes)

**Dark/Light Mode Auto-Switch**:
- Respects system preference (`prefers-color-scheme: dark`)
- User can override in settings
- All colors use CSS variables (no hardcoding #000 or #fff)

---

## V. FULL STACK: PUTTING IT TOGETHER

### **For a Typing Mode Component Request**

Use this prompt structure (example):

```
You are building PyTyping, a minimalist Python learning game 
inspired by Monkeytype. You focus on clean, keyboard-accessible React 
components that feel native to the app (no external libraries except React/Tailwind).

Context:
- Users see a Python code block and type it character-by-character
- Keystroke validation is real-time (no debounce)
- On error, the character highlights red and doesn't advance
- On success, the character highlights briefly and advances to next
- Stats update live: WPM, accuracy %, errors
- When code is 100% complete, transition to quiz mode (auto or with button)

Task: Build the TypingInput component

Requirements:
- Accept props: 
  - code: string (Python code to type)
  - onComplete: () => void (fire when user finishes)
  - onProgress: (progress: number, accuracy: number) => void (live stat updates)
- Render:
  - Code block (syntax-highlighted Python, non-editable display)
  - Input field (full-width monospace, invisible background, only shows cursor)
  - Stats bar (WPM, accuracy, errors — all live)
  - Progress indicator (visual bar showing % complete)
- Validation: 
  - Tab key → validate as spaces (config: 4 spaces per tab)
  - Newline → validate as \n
  - Indentation must match exactly (Python is whitespace-sensitive)
- Keyboard:
  - Ctrl+L or Cmd+L → focus the input (accessibility shortcut)
  - Esc → clear (user restart), confirm with modal first
- No external libraries (Prism.js OK for syntax highlighting if needed)

Constraints:
- Mobile responsive: Stack vertically below 768px, code block width shrinks but stays readable
- Dark mode: Use only CSS variables (--color-text-primary, etc.)
- Performance: Debounce stat updates (100ms) to avoid re-renders every keystroke
- Tone: Zen-like. No "you got it wrong!" messages. Just red/green feedback.

Example success state:
- User types the final character → code is 100% matched
- Slight pulse animation on the code block
- Stats freeze (no more updates)
- "Next" button appears or auto-transition to quiz

Include:
- TypeScript types for props and internal state
- Comments on the keystroke validation algorithm
- Keyboard event handlers with keyboard-navigate accessibility
```

**Claude Code will return**:
- A production-ready React component
- Clear prop interface
- Keystroke validation logic explained in comments
- Tailwind CSS classes inline (no separate CSS)
- Ready to drop into the app

---

## VI. LEARNING DESIGNER'S MENTAL MODEL

### **The Analogy**

**PyTyping is to Python what Monkeytype is to typing.**

In Monkeytype:
- You see English text
- You type it character by character
- Instant feedback: green if right, red if wrong
- WPM updates live
- At the end: your stats + time
- Result: You learn to type without thinking about the *process* of typing

In PyTyping:
- You see Python code
- You type it character by character
- Instant feedback: green if right, red if wrong
- Accuracy % updates live
- After code: quiz + breakdown
- Result: You learn to read/write Python syntax without overthinking it

**The Learning Stack**:
1. **Muscle Memory** (from typing): Syntax becomes intuitive
2. **Immediate Feedback** (red/green): Errors are caught in real-time
3. **Understanding** (quiz): Do you know what you just typed?
4. **Explanation** (breakdown): Why is this code written this way?

Each layer builds on the previous one.

---

## VII. BEFORE YOU START BUILDING

### **Checklist for Clarity**

- [ ] **Review System Prompt**: Read `/PyTyping_System_Prompt.md` to understand full scope
- [ ] **Study Monkeytype**: Spend 5 min on monkeytype.com. Notice: spaciousness, minimal UI, typography, keystroke feedback
- [ ] **Run first exercise**: Write a simple Python function on paper. Type it out. Notice what's hard (tabs vs spaces? indentation? syntax?)
- [ ] **Design system finalized**: Tailwind config + CSS variables ready (fonts, colors, spacing)
- [ ] **Exercises curated**: First 20 exercises in exercises.json (beginner + intro intermediate)
- [ ] **Component architecture**: Outline the React file structure:
  ```
  src/
    components/
      TypingInput.tsx
      QuizPanel.tsx
      BreakdownPanel.tsx
      ExerciseCard.tsx
      Settings.tsx
    pages/
      Home.tsx
      Typing.tsx
    types/
      exercise.ts
    data/
      exercises.json
    styles/
      globals.css (CSS variables)
  ```

### **First 3 Components to Build (In Order)**

1. **TypingInput** (core loop) — Most important, most complex
2. **QuizPanel** (post-typing) — Multiple-choice, instant feedback
3. **BreakdownPanel** (learning) — Static text + structured sections

**Then**: ExerciseCard, Settings, Home page, Progress tracker.

---

## VIII. SUCCESS LOOKS LIKE

### **Xander Completes PyTyping in 3-4 Weeks and Ships It**

- [ ] MVP complete: 50 exercises, typing mode, quiz, breakdown
- [ ] Deployed to Vercel with a public URL
- [ ] Mobile-responsive (tested on iPhone + Android tablet)
- [ ] Smooth typing experience (<100ms keystroke latency)
- [ ] Beautiful dark/light themes with CSS variables
- [ ] No console errors, <5 warnings in Lighthouse
- [ ] Keyboard-accessible (Tab through entire app works)
- [ ] Progress saved to LocalStorage (revisit tomorrow, continue where you left off)
- [ ] Pride in the craft (minimal, beautiful, educational)

### **By v1.0 (Week 5-6)**

- [ ] Challenge mode (build from skeleton code)
- [ ] 3-4 additional themes
- [ ] Leaderboard (top 50 by accuracy)
- [ ] Advanced exercises (async, decorators, context managers)
- [ ] Blog post: "Learn Python by Typing Code"

---

## IX. FINAL THOUGHT

Every keystroke is a chance to learn. The interface should fade away. What remains is the code, the feedback, and the *feeling* of mastery.

Build it with care. Ship it with pride.

---

**Next Step**: Open Claude Code and request the **TypingInput component** using the prompt structure from **Section V**. Reference this guide if Claude asks for clarification.
