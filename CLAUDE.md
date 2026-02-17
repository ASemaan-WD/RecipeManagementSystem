# AI-Enhanced Recipe Management Platform

## Project Documentation

The following documentation files define this project's specifications, architecture, and implementation plan:

- `ROADMAP.md` — Implementation phases, task breakdown, and sequencing
- `CTO_SPECS.md` — Technical architecture, stack decisions, and infrastructure constraints
- `PRODUCT_MANAGER.md` — Feature requirements, user stories, and acceptance criteria
- `SENIOR_DEVELOPER.md` — Implementation patterns, coding conventions, and development workflow
- `GENERAL_SPECS.md` — Project overview and general requirements

## Skills

The following skills are available and should be used when referenced:

### Task Definition Skill
**Triggers**: "use the task definition skill", "define a task", "define task for", "task definition"
**Action**: Read and follow the full process defined in `.claude/task-definition-skill.md`
**Purpose**: Guides the evidence-based process of scoping and defining a task — consulting the roadmap, auditing existing code, reading project docs, and establishing boundaries before any task file is created.

### Task Template Skill
**Triggers**: "use the task template skill", "create a task file", "write the task file", "task template"
**Action**: Read and follow the template and conventions defined in `.claude/task-template-skill.md`
**Purpose**: Defines the exact file naming, location (`docs/tasks/`), format (Markdown with YAML frontmatter), and structure for task files. The task definition skill invokes this skill as its final step.

> When both skills are invoked together (which is the typical flow), the task definition skill drives the process and the task template skill provides the output format.
