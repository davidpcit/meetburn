---
description: This document contains all development rules and guidelines for this project, applicable to all AI agents (Claude, Cursor, Codex, Gemini, etc.).
alwaysApply: true
---

## 0. Mandatory Workflow Order

**ALWAYS follow this sequence for ANY request (feature, fix, refactor, question). NEVER jump directly to code.**

1. **Vision** — Understand the goal. Review `docs/product-vision.md`. What problem are we solving and why?
2. **Architecture** — Review `docs/architecture-design.md`. Identify affected components, layers, and dependencies.
3. **Decisions** — Check `docs/decisions/` for relevant ADRs that constrain or guide the approach.
4. **Specs** — Review existing specs in `ai-specs/specs/`. Confirm or update them if needed.
5. **Tests** — Define or review the tests that will validate the behavior (TDD).
6. **Code** — Only now write or modify code.

> If any step reveals a conflict or gap, STOP and resolve it before proceeding.
> Skipping steps or jumping directly to code is a violation of these standards.

## 0.1. Required Project Documentation Structure

Every project MUST maintain the following documentation structure. Create these files at project start if they don't exist:

```
docs/
├── product-vision.md        # Product goals, target users, value proposition, success metrics
├── architecture-design.md   # System architecture, tech stack, layers, component interactions
└── decisions/               # Architectural Decision Records (ADRs)
    ├── ADR-001-<slug>.md
    ├── ADR-002-<slug>.md
    └── ...
```

**`docs/product-vision.md`** must cover: problem statement, target users, core value proposition, key features, success metrics.

**`docs/architecture-design.md`** must cover: system overview, tech stack, architectural layers, component interactions, data flow, key constraints.

**`docs/decisions/ADR-XXX-<slug>.md`** — create a new ADR for every significant architectural or technical decision using this format:
```markdown
# ADR-XXX: <Title>
## Status: [Proposed | Accepted | Deprecated | Superseded]
## Context
## Decision
## Consequences
```

## 1. Core Principles

- **Small tasks, one at a time**: Always work in baby steps, one at a time. Never go forward more than one step.
- **Test-Driven Development**: Start with failing tests for any new functionality (TDD), according to the task details.
- **Type Safety**: All code must be fully typed.
- **Clear Naming**: Use clear, descriptive names for all variables and functions.
- **Incremental Changes**: Prefer incremental, focused changes over large, complex modifications.
- **Question Assumptions**: Always question assumptions and inferences.
- **Pattern Detection**: Detect and highlight repeated code patterns.

## 2. Language Standards
- **English Only**: All technical artifacts must always use English, including:
    - Code (variables, functions, classes, comments, error messages, log messages)
    - Documentation (README, guides, API docs)
    - Jira tickets (titles, descriptions, comments)
    - Data schemas and database names
    - Configuration files and scripts
    - Git commit messages
    - Test names and descriptions

## 3. Specific standards

For detailed standards and guidelines specific to different areas of the project, refer to:

- [Backend Standards](./backend-standards.mdc) - API development, database patterns, testing, security and backend best practices
- [Frontend Standards](./frontend-standards.mdc) - React components, UI/UX guidelines, and frontend architecture
- [Documentation Standards](./documentation-standards.mdc) - Technical documentation structure, formatting, and maintenance guidelines, including AI standards like this document

