# Task Template Skill

> This skill defines the exact structure and conventions for creating task files. Task files are the executable blueprints that the AI will later use to implement changes. Every task file must be self-contained, precise, and actionable — a developer (or AI) should be able to pick it up and execute it without needing to ask questions.

---

## File Naming Convention

```
task-<phase_number>.<task_number>-<hyphen-separated-task-brief-description>.md
```

**Examples:**
- `task-1.1-initialize-nextjs-project-with-typescript.md`
- `task-1.3-configure-prisma-schema-and-database.md`
- `task-2.5-implement-recipe-search-api-endpoint.md`

**Rules:**
- Phase number matches the phase from `docs/ROADMAP.md`.
- Task number is sequential within the phase.
- Description is lowercase, hyphen-separated, and brief (3-8 words).
- No special characters beyond hyphens.

---

## File Location

Task files are organized by phase under:

```
docs/phases/phase<n>/
```

Where `<n>` is the phase number. For example, Phase 1 tasks go in `docs/phases/phase1/`, Phase 2 tasks go in `docs/phases/phase2/`, etc.

Create the directory if it does not exist.

---

## File Format

Markdown with YAML frontmatter. The frontmatter provides machine-readable metadata; the markdown body provides human-readable detail.

---

## Complete Task File Template

````markdown
---
task_id: "task-<phase>.<number>"
title: "<Clear, concise task title>"
phase: <phase_number>
task_number: <task_number>
status: "pending"
priority: "<high | medium | low>"
dependencies:
  - "<task_id of any prerequisite task>"
blocks:
  - "<task_id of any task that depends on this one>"
created_at: "<YYYY-MM-DD>"
---

# <Task Title>

## Current State

> Describe the state of the project/feature BEFORE this task is executed. What exists today? What is missing? Reference specific files, components, or documentation sections.

- **What exists**: <List current implementations, files, or infrastructure relevant to this task>
- **What is missing**: <What gap does this task fill?>
- **Relevant code**: <File paths and line references to existing code that this task touches or depends on>

---

## Desired Outcome

> Describe the state of the project/feature AFTER this task is completed. Be concrete and verifiable.

- **End state**: <What will exist when this task is done?>
- **User-facing changes**: <What will the user see or be able to do differently? Write "None" if this is an internal/infrastructure task>
- **Developer-facing changes**: <What new files, patterns, or structures will exist in the codebase?>

---

## Scope & Boundaries

### In Scope
- <Specific thing this task WILL do>
- <Another specific thing>

### Out of Scope
- <Specific thing this task will NOT do, even if related>
- <Another specific thing — reference the future task that will handle it if applicable>

### Dependencies
- <What must exist or be completed before this task can start>

---

## Implementation Details

### Section 1: <Descriptive Name of First Change Area>

**What to do**: <Clear description of the change>

**Where to find context**:
- <File path or documentation section that informs this change>
- <Another reference>

**Specific requirements**:
- <Requirement 1>
- <Requirement 2>

**Patterns to follow**:
- <Reference to existing code patterns, conventions from docs/SENIOR_DEVELOPER.md, or docs/CTO_SPECS.md>

---

### Section 2: <Descriptive Name of Second Change Area>

**What to do**: <Clear description of the change>

**Where to find context**:
- <File path or documentation section>

**Specific requirements**:
- <Requirement 1>

**Patterns to follow**:
- <Reference>

---

*(Add as many sections as needed to fully describe every aspect of the change. Each section should be independently understandable.)*

---

## Verification & Acceptance Criteria

### Build Verification
- [ ] Project builds without errors (`npm run build` or equivalent)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification
- [ ] <Specific testable behavior 1>
- [ ] <Specific testable behavior 2>
- [ ] <Specific testable behavior 3>

### Code Quality Checks
- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were partially implemented
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new code is traceable to a requirement in this task file
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- *(Empty until task execution begins)*
````

---

## Guidelines for Writing Task Files

### On Current State
- Be factual. Reference actual file paths and existing code.
- If the project is brand new and nothing exists yet, say so explicitly: "No implementation exists. The project has only specification documents."

### On Desired Outcome
- Must be **verifiable** — someone should be able to look at the codebase and confirm whether the outcome was achieved.
- Avoid vague language like "improve", "enhance", or "optimize" unless paired with measurable criteria.

### On Implementation Details
- Each section should map to a **logical unit of change** (e.g., a database schema change, a new API route, a UI component).
- Always point to **where context lives** — don't expect the executor to search for it.
- Reference specific patterns from `docs/SENIOR_DEVELOPER.md` or `docs/CTO_SPECS.md` when dictating how something should be built.

### On Verification
- Always include build verification — the project must compile and run after the task.
- Functional checks should be specific enough to test manually or programmatically.
- If the project has tests, include a check that existing tests still pass.

### On Boundaries
- The boundary checklist is non-negotiable. It exists to prevent scope creep during execution.
- The "Notes & Discoveries" section is the pressure valve — anything out of scope goes there, not into the implementation.
