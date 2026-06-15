# PyTyping Documentation

Complete project documentation for building PyTyping, a minimalist Python learning game inspired by Monkeytype.

---

## 📁 Files in This Package

### Core Documentation

1. **PyTyping_System_Prompt.md** — The Complete Project Brief
   - Full project vision, scope, and specifications
   - Feature set (MVP + future)
   - Exercise data structure and curation guidelines
   - Success criteria
   - **Read first** to understand what you're building

2. **PyTyping_Complete_Guide.md** — Strategic Frameworks & Design
   - Prompt engineering (6-element framework)
   - Grill-me outcomes (decisions already made)
   - Decision-council insights (why you chose strict validation, offline-first, etc.)
   - UI/UX system (distinctive, non-AI design)
   - Full-stack integration guide
   - Learning mental model
   - **Read this** to understand design decisions

3. **PyTyping_Ready_to_Use_Prompts.md** — Copy/Paste Prompts
   - Master prompt for full project overview
   - Individual component prompts (TypingInput, QuizPanel, BreakdownPanel)
   - Exact requirements, constraints, examples for each
   - **Use this** when building with Claude Code

4. **CONTEXT.md** — Quick Project Context
   - One-page summary of current state
   - Tech stack, design system, component architecture
   - Build order and what's been completed
   - File structure and conventions
   - **Paste this** at the start of each Claude session for quick context

5. **.claude-instructions** — Claude's Behavioral Guidelines
   - How Claude should build PyTyping components
   - Code style conventions and best practices
   - Design system reference (colors, typography, spacing)
   - Keystroke validation algorithm
   - Component-specific guidelines
   - Performance and accessibility standards
   - **Include this** in your project repo for consistency

6. **claude.md** — How to Use Claude Code Effectively
   - Claude Code basics (web, CLI, API)
   - The 3-step iteration loop
   - Best practices for component requests
   - Common questions and troubleshooting
   - Workflow examples
   - **Read this** to learn how to work with Claude

---

## 🚀 How to Get Started

### Step 1: Understand the Vision (15 min)
Read **PyTyping_System_Prompt.md** end-to-end. This is your north star.

### Step 2: Understand the Design (10 min)
Skim **PyTyping_Complete_Guide.md**, especially Section IV (UI/UX System).

### Step 3: Set Up Your Environment
```bash
# Create a new Vite + React + TypeScript project
npm create vite@latest pytyping -- --template react-ts

# Install dependencies
cd pytyping
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 4: Set Up Design System
Create `src/styles/globals.css` with CSS variables:
```css
:root {
  --color-background-primary: #F8F7F5;
  --color-background-secondary: #EFEFEC;
  --color-text-primary: #2C2C2A;
  --color-text-secondary: #888780;
  --color-text-tertiary: #B4B2A9;
  --color-accent: #1D9E75;
  --color-error: #E24B4A;
  --color-success: #639922;
  --color-border-primary: rgba(0, 0, 0, 0.4);
  --color-border-secondary: rgba(0, 0, 0, 0.3);
  --color-border-tertiary: rgba(0, 0, 0, 0.15);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background-primary: #0F0E0D;
    --color-background-secondary: #1A1917;
    --color-text-primary: #F1F0ED;
    --color-text-secondary: #888780;
    --color-text-tertiary: #5F5E5A;
    /* ... etc */
  }
}

body {
  font-family: 'Inter', sans-serif;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
}

code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

### Step 5: Curate First 20 Exercises
Create `src/data/exercises.json` with 20 beginner + intro intermediate exercises. Use the data structure from **PyTyping_System_Prompt.md** (Section "EXERCISE DATA STRUCTURE").

### Step 6: Start Building with Claude
Open Claude Code and:
1. Paste **CONTEXT.md** to get Claude up to speed
2. Copy a component prompt from **PyTyping_Ready_to_Use_Prompts.md**
3. Add your specific requirements
4. Claude builds the component
5. Copy/paste into your project
6. Test and iterate

**First component to build:** TypingInput (the hardest, most important)

---

## 📋 Building Checklist

- [ ] Read PyTyping_System_Prompt.md
- [ ] Read PyTyping_Complete_Guide.md (Section IV)
- [ ] Set up Vite + React + TypeScript project
- [ ] Set up CSS variables in globals.css
- [ ] Curate first 20 exercises in exercises.json
- [ ] Copy .claude-instructions into your project root
- [ ] Build TypingInput component (use Claude Code)
- [ ] Build QuizPanel component
- [ ] Build BreakdownPanel component
- [ ] Build ExerciseCard + Home page
- [ ] Build Settings component
- [ ] Build TypingPage (orchestrator)
- [ ] Test full flow end-to-end
- [ ] Deploy to Vercel
- [ ] Celebrate 🎉

---

## 🔄 The Build Workflow

```
START
  ↓
Read System Prompt (vision)
  ↓
Read Complete Guide (design)
  ↓
Set up environment + design system
  ↓
Curate exercises.json
  ↓
LOOP: For each component
  ├─ Copy CONTEXT.md
  ├─ Copy component prompt from Ready-to-Use-Prompts
  ├─ Open Claude Code
  ├─ Paste context + prompt
  ├─ Claude builds component
  ├─ Copy into project
  ├─ Test
  └─ Iterate if needed
  ↓
Deploy to Vercel
  ↓
Ship it! 🚀
```

---

## 🎯 Component Build Order

1. **TypingInput** (highest complexity, highest priority)
   - Keystroke validation algorithm
   - Real-time feedback
   - Live statistics

2. **QuizPanel** (medium complexity)
   - Multiple-choice rendering
   - Answer validation
   - Immediate feedback

3. **BreakdownPanel** (low complexity)
   - Text rendering
   - Structured sections
   - Related exercises links

4. **ExerciseCard + Home** (medium)
   - Exercise browser
   - Filtering by difficulty/topic
   - Exercise selection

5. **Settings** (low)
   - Theme customizer
   - Font picker
   - Sound toggle

6. **ProgressTracker** (low)
   - User stats display
   - Exercises completed
   - Topics mastered

7. **TypingPage** (medium)
   - Orchestrates components
   - Manages flow: Typing → Quiz → Breakdown

---

## 💡 Using This Documentation

### For Quick Reference
- **What am I building?** → PyTyping_System_Prompt.md
- **How should it look?** → PyTyping_Complete_Guide.md (Section IV)
- **What's the exact requirement?** → CONTEXT.md
- **How do I work with Claude?** → claude.md
- **What code style should I follow?** → .claude-instructions

### For Building Components
1. Open **PyTyping_Ready_to_Use_Prompts.md**
2. Find the component you want to build
3. Copy the prompt
4. Paste into Claude Code
5. Reference **CONTEXT.md** and **.claude-instructions** if Claude asks questions

### For Onboarding (New Session)
1. Paste **CONTEXT.md** into Claude
2. Add your component request
3. Reference **.claude-instructions** if you want Claude to follow specific patterns

---

## 🎨 Design System Quick Reference

**Colors (always use CSS variables)**
```css
var(--color-background-primary)     /* Page background */
var(--color-text-primary)           /* Main text */
var(--color-accent)                 /* Interactive elements */
var(--color-error)                  /* Errors */
var(--color-success)                /* Success */
var(--color-border-primary)         /* Borders */
```

**Typography**
```css
font-mono 14px 1.6 lh              /* Code */
font-sans 14px 400                 /* Body text */
font-sans 18px 500                 /* Headings */
```

**Spacing**
```
4px, 8px, 12px, 16px, 24px, 32px
```

**Corners**
```
rounded-md (8px) for inputs/buttons
rounded-lg (12px) for cards
```

**Borders**
```
0.5px only (never 1px)
border-[var(--color-border-tertiary)]
```

---

## 🛠 Troubleshooting

### "I don't know where to start"
→ Read PyTyping_System_Prompt.md cover-to-cover. It answers most questions.

### "Claude's code doesn't match my expectations"
→ Read claude.md (Section "Best Practices for Claude Code Requests"). Be more specific in your prompt.

### "I forgot the design system rules"
→ Reference .claude-instructions (Section "Design System Reference") or CONTEXT.md

### "I want to iterate on a component"
→ Follow the 3-step loop in claude.md: Request → Build → Iterate

### "The component doesn't feel like PyTyping"
→ Check .claude-instructions (Section "When Building Components") for DO/DON'T rules

---

## 📞 Files at a Glance

| File | Purpose | Read When |
|------|---------|-----------|
| PyTyping_System_Prompt.md | Complete project spec | Starting out |
| PyTyping_Complete_Guide.md | Design + frameworks | Understanding design decisions |
| PyTyping_Ready_to_Use_Prompts.md | Copy/paste prompts | Building a component |
| CONTEXT.md | Quick project snapshot | New Claude session |
| .claude-instructions | Claude's behavior rules | Including in project repo |
| claude.md | Claude Code tutorial | Learning how to use Claude Code |
| README.md (this file) | Navigation guide | Lost and need orientation |

---

## 🚀 You're Ready

You have everything you need:
- **Vision** (System Prompt)
- **Design** (Complete Guide)
- **Prompts** (Ready-to-Use)
- **Context** (CONTEXT.md)
- **Guidelines** (.claude-instructions)
- **Tutorial** (claude.md)

Start with the TypingInput prompt. Build it with Claude. Ship it. 

Good luck. You've got this. 🎯

---

**Last updated**: June 15, 2026  
**Project**: PyTyping — Learn Python by Typing Code  
**Status**: Ready to build