# PyTyping: Ready-to-Use Claude Code Prompt

Copy and paste this prompt (or parts of it) directly into Claude Code to begin building.

---

## READY-TO-USE PROMPT: Start Here

```
You are building PyTyping, a minimalist Python learning game inspired by Monkeytype.

ROLE & CONTEXT
===============
PyTyping teaches Python through muscle memory + immediate feedback.
- Users see a Python code snippet and type it character-by-character
- Real-time keystroke validation: correct chars highlight green, incorrect chars highlight red
- After completing code: a 3-5 question quiz tests understanding
- Then: a breakdown explains concepts, new functions, terminology, design patterns
- Target: CS students (beginner to advanced) + engineers brushing up

Design inspiration: Monkeytype's minimalist, spacious, keyboard-native interface
Tech stack: React, TypeScript, Tailwind CSS, Vite (no backend for MVP)
Exercises: Sourced from Real Python, official docs, Stack Overflow (curated + original)

DESIGN PRINCIPLES
=================
1. MINIMAL AESTHETICS: No gradients, shadows, animations (except functional feedback)
2. KEYBOARD-FIRST: All interactions work via keyboard (Tab, Enter, Esc)
3. MONOSPACE CODE HERO: The code block dominates; UI fades into background
4. ACCESSIBLE: WCAG 2.1 AA minimum (focus visible, color contrast, labels)
5. OFFLINE-FIRST: No external APIs needed; exercises.json embedded in build

PROJECT SCOPE (MVP)
===================
✅ IN SCOPE:
- Typing mode (guided code exercise with real-time keystroke validation)
- Quiz mode (3-5 multiple-choice questions post-exercise)
- Breakdown panel (conceptual explanation with key terms, design patterns)
- Exercise browser (filter by difficulty, topic; select to start)
- Settings (theme customizer, font/size picker, sound toggle)
- Progress tracking (exercises completed, accuracy stats, topics mastered)
- Dark/light themes with CSS variables (2 presets shipped, custom editor in settings)

❌ OUT OF SCOPE (v2+):
- Multiplayer/leaderboards
- Community user submissions
- Video lessons
- Advanced analytics
- Spaced repetition

BUILD THESE FIRST (In Order)
=============================
1. TypingInput — Core loop (most complex, most important)
2. QuizPanel — Multiple-choice validation
3. BreakdownPanel — Structured explanation
4. ExerciseCard — Browse UI
5. Settings — Customization
6. Home — Landing + exercise selection
7. ProgressTracker — User stats

CURRENT TASK
============
Build [COMPONENT NAME] for PyTyping.

REQUIREMENTS
============
[Include the specific requirements for the component you're building]

CONSTRAINTS
===========
- React functional component with TypeScript
- Tailwind CSS utility classes only (no separate CSS files)
- Props should be explicitly typed
- Keyboard-accessible (Tab, Enter, Esc all work)
- Mobile-responsive (768px breakpoint)
- Dark mode: Use only CSS variables (--color-text-primary, --color-background-primary, etc.)
- No external libraries except React/TypeScript/Tailwind
- Performance: Use React.memo() for large lists, useCallback() for event handlers
- Comments on non-obvious logic (especially keystroke validation, quiz logic, breakdown rendering)

EXAMPLE: MINIMAL, INTENTIONAL DESIGN
====================================
- No celebratory animations
- Error feedback: red highlight (not flashing, not loud sounds by default)
- Success feedback: green highlight + advance to next character
- Stats are live but debounced (update every 100ms, not every keystroke)
- Focus ring on inputs: 2px outline in accent color
- Hover states: subtle (1-2% background color shift, no text color changes)

OUTPUT EXPECTATIONS
===================
A production-ready React component that:
- Includes the full TypeScript interface
- Has 100+ lines of logic
- Includes comments on the algorithm (keystroke validation, quiz logic, etc.)
- Exports as default
- Is ready to integrate into the larger app
- Has no console errors or warnings

DO NOT INCLUDE:
- Dummy/placeholder data (we're loading exercises.json)
- npm install commands
- Build/config instructions (Vite + Tailwind already set up)
- Separate CSS files (use Tailwind inline)

REFERENCE MATERIAL
==================
- Design system: See PyTyping_Complete_Guide.md (Section IV)
- Full project scope: See PyTyping_System_Prompt.md
- Monkeytype aesthetic: Visit monkeytype.com (notice spaciousness, typography, keystroke feedback)

NEXT STEPS
==========
[Specify exactly what you're building in this session]
```

---

## SPECIFIC PROMPTS FOR EACH MAJOR COMPONENT

### 1. Building TypingInput (Core Loop)

```
You are building PyTyping, a minimalist Python learning game inspired by Monkeytype.

[Copy the ROLE & CONTEXT from above, through CONSTRAINTS]

CURRENT TASK: Build the TypingInput component (the core typing loop)

REQUIREMENTS
============
The TypingInput component enables users to type a Python code snippet character-by-character 
with real-time validation.

Props:
  - code: string (the Python code to type, e.g., "def hello():\n    print('hi')")
  - onComplete: () => void (called when user finishes typing all characters)
  - onProgress: (progress: number, accuracy: number) => void (called on each keystroke with % complete and accuracy)
  - onQuit?: () => void (optional: user presses Esc to exit)

The component should:
  1. Display the code in a read-only, syntax-highlighted code block (use Prism.js)
  2. Provide an invisible input field that captures keystrokes
  3. Validate each keystroke in real-time:
     - If the character matches the next expected character in code, highlight it green and advance
     - If the character does NOT match, highlight it red and do NOT advance (user must correct)
     - Treat tabs as equivalent to 4 spaces (user preference: configurable in settings)
     - Exact whitespace matching required (Python is whitespace-sensitive)
  4. Display live stats:
     - Typing speed (WPM, optional — not emphasized)
     - Accuracy percentage (characters correct / total typed)
     - Errors count (mismatches)
  5. Handle keyboard navigation:
     - Ctrl+L (or Cmd+L on Mac) to focus the input
     - Esc to quit with confirmation modal
     - Spacebar: just a character, not a restart trigger
  6. Transition on completion:
     - Show a "Next" button (or auto-transition with a slight delay)
     - Call onComplete() to trigger the quiz

Visual feedback:
  - Correct character: subtle green highlight (not flashing)
  - Incorrect character: red highlight + optional quiet sound (default muted)
  - Progress bar: shows % complete as user types
  - Code block: monospace, line-numbered, syntax-highlighted
  - Input field: full-width, invisible (just a cursor), monospace font

CONSTRAINTS
===========
[Copy from above]

EXAMPLE KEYSTROKE SEQUENCE
===========================
Code to type: 
```
def add(x, y):
    return x + y
```

User presses: d → green, advance
User presses: e → green, advance
User presses: f → green, advance
User presses: (space) → green, advance
User presses: a → green, advance
User presses: x → WRONG (expected 'd') → red, do not advance
User presses: d → green, advance
[... continues until all characters typed]
Final character entered → onComplete() fires → transition to quiz

IMPLEMENTATION NOTES
====================
- Keystroke validation: Compare code[userInputLength] with each keystroke (O(1) per keystroke)
- WPM calculation: (charactersTyped / 5) / (elapsedSeconds / 60) — only count correct characters
- Accuracy: correctCharacters / totalExpectedCharacters
- Tab handling: When user presses Tab, count it as 4 characters (or whatever their setting is)
- Syntax highlighting: Use Prism.js with Python lexer; apply theme colors from CSS variables
- Focus management: Input field is always focused unless user opens a modal (Esc confirmation)

OUTPUT
======
The complete TypingInput.tsx component, ready to integrate.
```

---

### 2. Building QuizPanel (Post-Exercise)

```
You are building PyTyping, a minimalist Python learning game inspired by Monkeytype.

[Copy ROLE & CONTEXT, DESIGN PRINCIPLES, CONSTRAINTS from main prompt]

CURRENT TASK: Build the QuizPanel component (post-exercise knowledge check)

REQUIREMENTS
============
The QuizPanel presents 3-5 multiple-choice questions testing understanding of the code 
the user just typed.

Props:
  - exerciseId: string (for analytics/logging)
  - questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>
  - onComplete: (scores: { correct: number, total: number }) => void (when user finishes all questions)

The component should:
  1. Display one question at a time (or all questions in a scrollable list, designer's choice)
  2. Show question text + 4 multiple-choice options (radio buttons or clickable cards)
  3. On selection:
     - Immediately show if correct (green checkmark) or incorrect (red X)
     - Show the explanation (1-2 sentences why the answer is right/wrong)
     - If incorrect, highlight the correct answer in green
     - Disable further clicks on that question
  4. Progress indicator: "Question 2 of 5" or visual progress bar
  5. After all questions answered:
     - Show summary: "You got 4 out of 5 correct (80%)"
     - Call onComplete() to transition to breakdown panel
  6. Keyboard navigation:
     - Arrow keys or Tab to move between options
     - Enter to select
     - No Esc exit (must complete quiz)

Visual feedback:
  - Correct answer: green checkmark + green background on option
  - Incorrect answer: red X + red background on option
  - Correct (revealed): green background, slightly brighter
  - Question text: bold/prominent
  - Explanation text: secondary color, 12-13px, italic

CONSTRAINTS
===========
[Copy from main prompt]

EXAMPLE QUIZ
============
Exercise: User just typed a function that reverses a list

Question 1: "What data structure does this function return?"
Options:
  A) A string
  B) A list ← correct
  C) A tuple
  D) A generator

User clicks B → Green checkmark appears
Explanation: "Lists are mutable and preserve order. The function returns a list, not a tuple (immutable) or generator (lazy)."
Progress: "Question 1 of 5"

[User continues to next question...]

OUTPUT
======
The complete QuizPanel.tsx component, ready to integrate.
```

---

### 3. Building BreakdownPanel (Learning Explanation)

```
You are building PyTyping, a minimalist Python learning game inspired by Monkeytype.

[Copy ROLE & CONTEXT, DESIGN PRINCIPLES, CONSTRAINTS from main prompt]

CURRENT TASK: Build the BreakdownPanel component (learning explanation post-quiz)

REQUIREMENTS
============
The BreakdownPanel teaches what the user just typed. It's a structured, educational explanation.

Props:
  - exercise: {
      title: string;
      code: string;
      explanation: {
        overview: string;
        keyTerms: Array<{ term: string; definition: string }>;
        howItWorks: string;
        designPattern?: string;
        relatedExercises: string[];
      };
    }
  - onNext: () => void (user clicks "Next Exercise" button)

The component should display:
  1. HEADER: Exercise title (e.g., "Write a Fibonacci Generator")
  2. OVERVIEW (2-3 sentences): What does this code do? Real-world use case?
     "This function generates Fibonacci numbers using recursion. It's used in algorithms,
      mathematical computations, and performance optimization studies."
  3. KEY TERMS section:
     - List of new terminology introduced in the code
     - Format: Bold term + definition (1-2 sentences)
     - Example: 
       - **Recursion**: A function that calls itself with a simpler input until reaching a base case
       - **Base case**: The condition that stops recursion; without it, the function loops infinitely
  4. HOW IT WORKS section:
     - Step-by-step explanation or narrative walk-through
     - Can include the code snippet again with annotations
     - Example: "The function checks if n <= 1 (base case). If true, it returns n. 
       Otherwise, it calls itself with n-1 and n-2, summing the results."
  5. DESIGN PATTERN section (if applicable):
     - Name the pattern: "Recursion", "List Comprehension", "Decorator", etc.
     - Explain where it appears in the code
     - Why it's useful
  6. RELATED EXERCISES:
     - Links to 2-3 follow-up exercises that build on this concept
     - Format: Card grid with exercise titles
     - Clicking a card navigates to that exercise
  7. FOOTER: "Next Exercise" button + option to revisit this explanation later

Visual layout:
  - Vertical stack of sections
  - Each section has a subtle border/divider
  - Key terms: left-aligned, monospace font for term names
  - Code annotations: inline or as a separate callout box
  - Related exercises: grid of 2-3 cards
  - Scrollable (if content exceeds viewport)

Tone:
  - Educational but not condescending
  - Explain WHY, not just WHAT
  - "This pattern is useful because..." not just "This is a recursion"
  - Encourage deeper learning with follow-up exercises

CONSTRAINTS
===========
[Copy from main prompt]

EXAMPLE BREAKDOWN
=================
Exercise: "Write a Fibonacci Generator"

OVERVIEW
"This function generates Fibonacci numbers using recursion. It's used in algorithm analysis, 
performance optimization studies, and mathematical problems."

KEY TERMS
- **Recursion**: A function that calls itself with a simpler input until reaching a base case
- **Base case**: The stopping condition; without it, recursion loops infinitely
- **Call stack**: The stack of function calls; deep recursion can cause stack overflow

HOW IT WORKS
"1. Check if n <= 1 (base case). If true, return n directly.
 2. If not, call fib(n-1) and fib(n-2) recursively.
 3. Sum the two results and return.
 4. Each recursive call adds a frame to the call stack."

DESIGN PATTERN
"Recursion: A powerful but sometimes inefficient pattern. This naive implementation recomputes 
the same values many times. Optimization: use memoization or dynamic programming for better performance."

RELATED EXERCISES
[Cards for: "Memoization", "Dynamic Programming: Fibonacci", "Recursive Tree Traversal"]

OUTPUT
======
The complete BreakdownPanel.tsx component, ready to integrate.
```

---

## HOW TO USE THESE PROMPTS

1. **For the entire first session**: Copy the READY-TO-USE PROMPT (the big one at the top)
2. **For building specific components**: Copy the component-specific prompt (e.g., TypingInput, QuizPanel, etc.)
3. **Customize as needed**: Add "In this session, build X" to the end of any prompt
4. **Ask for clarification**: If Claude asks questions, that's good — answer clearly and reference the design system

Example full request to Claude Code:
```
[Paste the TypingInput prompt from above]

In this session, build the TypingInput component. 
Start with the prop interface and keystroke validation algorithm, 
then move to rendering and state management.
```

---

## CHECKLIST BEFORE FIRST PROMPT

- [ ] Read PyTyping_System_Prompt.md (full scope)
- [ ] Read PyTyping_Complete_Guide.md (design + decisions)
- [ ] Have exercises.json ready (first 20 exercises curated)
- [ ] Tailwind CSS + Vite project initialized
- [ ] CSS variables set up (colors, fonts, spacing)
- [ ] React Router or routing solution decided
- [ ] Clear on component folder structure

---

**You're ready. Copy a prompt above and start building.**

Build it with care. Ship it with pride. Every keystroke teaches something.
