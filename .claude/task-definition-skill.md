# Task Definition Skill

> This skill guides the AI through the disciplined process of defining a well-scoped, evidence-based task. It ensures that every task is grounded in project reality — not assumptions — and that the AI gathers comprehensive context before committing to any task definition.

---

## Core Principles

### 1. Zero Assumptions, Zero Inference
- **Every claim must be backed by evidence** found in the codebase or project documentation.
- Do NOT assume what a function does — read it. Do NOT assume a feature exists — verify it. Do NOT assume a pattern is followed — confirm it.
- If you cannot find evidence for something, it does not exist in the project. Do not fill gaps with guesses.

### 2. Strict Task Boundaries
- A task must do **one thing well** and nothing more.
- Do NOT bleed into adjacent tasks, future tasks, or unrelated improvements.
- If you discover something that needs fixing but is out of scope, note it as a separate future concern — do NOT fold it into the current task.
- The task must have a clear entry point (what exists now) and a clear exit point (what should exist after).

### 3. Evidence-Driven Decision Making
- When making any decision about scope, approach, or implementation — cite the source (file path, documentation section, or code reference).
- When two sources conflict, flag it and escalate to the user.

---

## Mandatory Process (Follow in Order)

### Step 1: Consult the Roadmap
- **First**, check `docs/ROADMAP.md` at the project root.
- If not found, search broadly for any roadmap-related files (`roadmap`, `phases`, `milestones`, `plan`).
- Identify:
  - What phase are we currently in?
  - What tasks belong to this phase?
  - What tasks are explicitly deferred to later phases?
  - What dependencies exist between tasks?
- This establishes the **strategic context** — where does this task fit in the bigger picture?

### Step 2: Audit Existing Functionality
- Before deciding to build anything new, **thoroughly scan the codebase** for existing implementations.
- Search for:
  - Related components, pages, API routes, utilities, and hooks.
  - Database models/schemas that may already cover the need.
  - Shared libraries or helpers that could be reused.
- **Goal**: Understand what already exists so the task builds on it rather than duplicating or conflicting with it.

### Step 3: Consult Project Documentation
- Read the relevant documentation files to understand architectural decisions, constraints, and conventions:
  - `docs/CTO_SPECS.md` — Technical architecture, technology choices, infrastructure decisions, and non-negotiable technical constraints.
  - `docs/PRODUCT_MANAGER.md` — Feature requirements, user stories, acceptance criteria, and product priorities.
  - `docs/SENIOR_DEVELOPER.md` — Implementation patterns, coding conventions, best practices, and development workflow.
  - `docs/GENERAL_SPECS.md` — Project overview, scope, and general requirements.
- Extract anything relevant to the task at hand: patterns to follow, constraints to respect, conventions to maintain.

### Step 4: Conduct External Research (If Necessary)
- If the task involves a technology, library, API, or pattern that is not fully documented within the project, perform targeted online research.
- Focus on:
  - Official documentation for libraries/frameworks used in the project.
  - Best practices for the specific pattern or approach being implemented.
  - Known issues or gotchas relevant to the task.
- **Do NOT adopt a new approach just because it's popular** — it must align with the project's established stack and conventions as documented in `docs/CTO_SPECS.md` and `docs/SENIOR_DEVELOPER.md`.

### Step 5: Define the Expected Outcome
- Before writing the task, articulate clearly:
  - **What does "done" look like?** — Describe the end state in concrete, verifiable terms.
  - **What should the user be able to do after this task is complete?** — User-facing behavior changes.
  - **What should the developer see in the codebase after this task is complete?** — Files created/modified, patterns followed.
- This expected outcome becomes the north star for the entire task. Every section of the task file should trace back to it.

### Step 6: Establish Boundaries
- Explicitly state:
  - **In scope**: What this task WILL do.
  - **Out of scope**: What this task will NOT do (even if related or tempting).
  - **Dependencies**: What must exist before this task can begin.
  - **Blocked by**: Any tasks or decisions that must be resolved first.
  - **Blocks**: Any future tasks that depend on this task's completion.

### Step 7: Create the Task File
- Using the **task-template-skill**, produce the task file and place it in `docs/phases/phase<n>/` where `<n>` is the phase number.
- The task file must reflect everything gathered in Steps 1-6.

---

## When in Doubt

Follow this escalation chain:

1. **Check the code** — the source of truth is always the codebase itself.
2. **Check the documentation** — `docs/CTO_SPECS.md`, `docs/PRODUCT_MANAGER.md`, `docs/SENIOR_DEVELOPER.md`, `docs/GENERAL_SPECS.md`, `docs/ROADMAP.md`.
3. **Check online resources** — official docs, relevant guides.
4. **Ask the user** — if none of the above resolves the uncertainty, **always ask**. Never guess. Never assume. A wrong assumption costs more than a clarifying question.

---

## Anti-Patterns (What NOT To Do)

- **Scope creep**: "While we're at it, let's also..." — No. Stick to the task.
- **Assumed existence**: "This component probably handles..." — No. Read the code and confirm.
- **Premature optimization**: "We should also add caching for..." — No. Unless the task explicitly calls for it.
- **Filling in blanks**: "The docs don't say, so I'll assume..." — No. Ask.
- **Borrowing from future phases**: "Phase 3 needs this anyway, so let's start..." — No. Respect phase boundaries.
- **Invisible decisions**: Making architectural choices without citing documentation or getting approval.
