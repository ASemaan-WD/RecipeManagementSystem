# Task Execution Skill

> This skill guides the AI agent through the disciplined execution of a task file. The task file is the single source of truth for what needs to be done. The agent's job is to implement exactly what the task describes — nothing more, nothing less — while maintaining the highest code quality standards and never making a decision without evidence.

---

## Core Principles

### 1. The Task File Is Law
- The task file defines what to build, where to build it, and what boundaries to respect.
- Do NOT deviate from the task file. Do NOT add features, optimizations, or "nice-to-haves" that are not specified.
- If the task file is ambiguous or incomplete, **stop and ask the user** — do not fill in the gaps yourself.

### 2. Zero Assumptions, Zero Inference
- Every implementation decision must be backed by **concrete evidence** from one of these sources:
  1. The task file itself.
  2. The existing codebase (read the actual code, don't guess).
  3. Project documentation (`docs/CTO_SPECS.md`, `docs/SENIOR_DEVELOPER.md`, `docs/PRODUCT_MANAGER.md`, `docs/GENERAL_SPECS.md`, `docs/ROADMAP.md`).
- If evidence cannot be found in any of these sources, **ask the user**.

### 3. Best Practices Are Non-Negotiable
- Follow established software engineering best practices at all times.
- Code must be clean, readable, and maintainable — not just functional.

---

## Mandatory Process (Follow in Order)

### Step 1: Read and Internalize the Task File
- Read the entire task file from `docs/phases/phase<n>/` (where `<n>` is the phase number).
- Understand:
  - **Current State** — What exists right now?
  - **Desired Outcome** — What must exist when done?
  - **Scope & Boundaries** — What is in scope and what is explicitly out of scope?
  - **Implementation Details** — Every section describing what to change and where.
  - **Verification & Acceptance Criteria** — How will success be measured?
  - **Boundary Enforcement Checklist** — What must NOT happen?

### Step 2: Gather Detailed Context
- Before writing a single line of code, build a comprehensive understanding of the current state:
  - **Read every file** referenced in the task's "Current State" and "Implementation Details" sections.
  - **Read related files** — imports, dependencies, types, schemas, adjacent components.
  - **Read the relevant documentation** — `docs/CTO_SPECS.md` for architecture constraints, `docs/SENIOR_DEVELOPER.md` for coding patterns, `docs/PRODUCT_MANAGER.md` for acceptance criteria.
  - **Understand the patterns** already established in the codebase — naming conventions, file structure, component patterns, error handling patterns, API patterns.
- The goal is to have **full situational awareness** before making any changes. No surprises mid-implementation.

### Step 3: Create an Execution Plan
- Based on the task file and gathered context, produce a **step-by-step execution plan**.
- The plan must:
  - Map directly to the sections in the task file's "Implementation Details".
  - Specify the exact files to create or modify.
  - Specify the order of operations (what must be done first).
  - Identify any risks or areas that need extra attention.
  - Include verification steps between major sections.
- **Present the plan to the user and wait for approval before proceeding.** Do not write any code until the plan is approved.

### Step 4: Execute Section by Section
- Work through the approved plan one section at a time.
- For each section:
  1. **Re-read the relevant task file section** to confirm what's needed.
  2. **Implement the change** following all coding standards (see below).
  3. **Verify the change** builds and doesn't break existing functionality.
  4. **Move to the next section** only when the current one is solid.

### Step 5: Final Verification
- After all sections are complete, run through the full verification:
  - **Build verification**: The project must build without errors.
  - **Lint/type check**: No new TypeScript errors, no new linting violations.
  - **Functional verification**: Manually verify every acceptance criterion from the task file.
  - **Run existing tests**: If the project has tests, they must all pass.
  - **Boundary enforcement checklist**: Confirm no out-of-scope changes were made.

### Step 6: Document Discoveries
- Fill in the "Notes & Discoveries" section of the task file with anything relevant found during execution that is out of scope.
- These notes feed into future task definitions.

---

## Coding Standards

### DRY (Don't Repeat Yourself)
- **Never duplicate logic.** If the same logic exists or is needed in multiple places, extract it into a shared utility, hook, helper, or component.
- Before writing new code, **search the codebase** for existing implementations that do the same thing or something similar.
- If an existing utility almost works, extend it rather than creating a parallel one — but only if the extension is within scope.

### Single Responsibility per File
- **One class per file.** One primary component per file. One primary utility per file.
- Do NOT bundle multiple classes, multiple unrelated components, or multiple unrelated functions into a single file.
- Helper functions that are private to a component can live in the same file, but anything reusable gets its own file.

### Naming Conventions
- Follow the naming patterns already established in the codebase. Read existing files to identify them.
- If no pattern exists yet, follow the conventions defined in `docs/SENIOR_DEVELOPER.md`.
- File names, variable names, function names, and type names must all be clear, descriptive, and consistent.

### Error Handling
- Handle errors explicitly. Do not swallow errors silently.
- Follow the error handling patterns established in the codebase and documented in `docs/CTO_SPECS.md` / `docs/SENIOR_DEVELOPER.md`.
- User-facing errors must be meaningful and actionable.

### Type Safety
- Use proper TypeScript types everywhere. No `any` unless explicitly justified and documented.
- Define interfaces and types for all data structures.
- Leverage the type system to prevent bugs at compile time.

### Code Organization
- Follow the project's established file/folder structure.
- New files go in the location that matches the existing organizational pattern.
- Imports should be organized and follow the project's import ordering convention.

### No Dead Code
- Do not leave commented-out code, unused imports, unused variables, or placeholder implementations.
- Every line of code must serve a purpose.

### Configuration Over Hardcoding
- No magic numbers, no hardcoded strings for values that could change.
- Use constants, environment variables, or configuration files as appropriate.
- Follow the project's existing configuration patterns.

---

## Conflict & Ambiguity Resolution

### Misalignment Between Documents
If you discover contradictions between:
- The task file and `docs/CTO_SPECS.md`
- The task file and `docs/SENIOR_DEVELOPER.md`
- The task file and `docs/ROADMAP.md`
- Any two documentation files

**STOP immediately and ask the user.** Do not pick a side. Do not make a judgment call. Present the conflict clearly and let the user decide.

### Ambiguity in the Task File
If any section of the task file is vague, incomplete, or open to interpretation:
- **Do not interpret it yourself.**
- Ask the user for clarification with specific options if possible.
- Do not proceed past the ambiguous section until it's resolved.

### Unexpected Codebase State
If the actual codebase does not match what the task file describes in "Current State":
- **STOP and flag it.** The task file may be outdated or based on incorrect assumptions.
- Describe the discrepancy to the user and wait for guidance.

---

## Boundary Enforcement

During execution, continuously check:

- **Am I still within the task's stated scope?** If what you're doing isn't listed under "In Scope", stop.
- **Am I touching files that aren't mentioned in the task?** If yes, justify it — does the task's implementation logically require it? If unsure, ask.
- **Am I adding functionality that isn't in the task?** Even if it's "obviously needed", if it's not in the task, it doesn't get built. Log it in "Notes & Discoveries" instead.
- **Am I refactoring code that isn't broken?** The task is not an invitation to clean up the neighborhood. Stick to the job.
- **Am I future-proofing?** Building for hypothetical future requirements is out of scope unless the task explicitly calls for it.

---

## Anti-Patterns (What NOT To Do)

- **Code first, understand later**: Never start coding before fully reading the task file, gathering context, and getting plan approval.
- **Assumption-driven development**: "This probably needs..." — No. Find evidence or ask.
- **Gold plating**: Adding extras that weren't requested — extra validation, extra logging, extra config options, "just in case" code.
- **Silent conflict resolution**: Noticing a conflict between docs and quietly picking one — always escalate.
- **Scope creep during execution**: "While I'm here, I'll also fix..." — No. Log it, move on.
- **Skipping verification**: Never skip the build check or acceptance criteria verification.
- **Copying patterns blindly**: If existing code has bad patterns, don't propagate them. Flag it and ask how to proceed.
- **Large uncommitted changes**: If you've made significant progress, suggest a checkpoint to the user in case they want to commit.
