# AI-Enhanced Recipe Management Platform

## Project Documentation

The following documentation files define this project's specifications, architecture, and implementation plan:

- `docs/ROADMAP.md` — Implementation phases, task breakdown, and sequencing
- `docs/CTO_SPECS.md` — Technical architecture, stack decisions, and infrastructure constraints
- `docs/PRODUCT_MANAGER.md` — Feature requirements, user stories, and acceptance criteria
- `docs/SENIOR_DEVELOPER.md` — Implementation patterns, coding conventions, and development workflow
- `docs/GENERAL_SPECS.md` — Project overview and general requirements

## Skills

The following skills are available and should be used when referenced:

### Task Definition Skill
**Triggers**: "use the task definition skill", "define a task", "define task for", "task definition"
**Action**: Read and follow the full process defined in `.claude/task-definition-skill.md`
**Purpose**: Guides the evidence-based process of scoping and defining a task — consulting the roadmap, auditing existing code, reading project docs, and establishing boundaries before any task file is created.

### Task Template Skill
**Triggers**: "use the task template skill", "create a task file", "write the task file", "task template"
**Action**: Read and follow the template and conventions defined in `.claude/task-template-skill.md`
**Purpose**: Defines the exact file naming, location (`docs/phases/phase<n>/`), format (Markdown with YAML frontmatter), and structure for task files. The task definition skill invokes this skill as its final step.

### Task Execution Skill
**Triggers**: "use the task execution skill", "execute task", "execute this task", "run task", "implement task", "task execution"
**Action**: Read and follow the full process defined in `.claude/task-execution-skill.md`
**Purpose**: Guides the disciplined implementation of a task file — gathering context, creating a plan (presented for user approval before any code is written), executing section by section with strict coding standards (DRY, single class per file, no assumptions), running final verification (build + tests + acceptance criteria), and enforcing boundaries throughout. Any ambiguity or conflict between documents must be escalated to the user.

---

> **Typical workflow**: The *task definition skill* scopes and defines the task, the *task template skill* provides the output format for the task file, and the *task execution skill* implements it. They can be used independently or in sequence.
