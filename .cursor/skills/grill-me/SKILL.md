---
description: Align before coding. Ask detailed questions until the task scope, design, and edge cases are fully understood.
---

# /grill-me

## Purpose
Before writing any code, get grilled on what you actually want to build. Prevents misalignment, wasted tokens, and half-baked implementations.

## What the agent must ask

### 1. Goal
- What exactly are we building? (one sentence)
- What's the expected outcome / definition of done?

### 2. Scope
- What's in scope?
- What's explicitly NOT in scope? (anti-scope)
- Is this a new feature, a bug fix, or a refactor?

### 3. Technical Context
- Which stack / framework / language?
- Which files or modules will be touched?
- Is there an existing pattern to follow? (link to example)
- Database changes needed? Migrations?

### 4. Design & Constraints
- Performance requirements? (latency, throughput)
- Security considerations? (auth, validation, rate limiting)
- Error handling strategy? (how are errors surfaced?)
- Testing expectations? (unit, integration, e2e?)

### 5. Edge Cases
- What happens when input is invalid?
- What happens when a dependency fails (DB, API, 3rd party)?
- What happens on concurrent access?
- What happens on retry / duplicate request?

### 6. State & Data Flow
- What are the states? (draw state machine)
- What transitions are valid/invalid?
- Where does data persist? (DB, cache, filesystem, memory)

## Output
The session produces:
- Clear scope document (can be saved as `docs/scope-{feature}.md`)
- State machine diagram (mermaid)
- List of edge cases covered
- Any decisions recorded

## When to use
Use `/grill-me` **before every significant coding task** — especially when:
- Requirements are vague
- The task touches multiple modules
- You're not 100% sure what the agent will build
- You've been burned before by "it built the wrong thing"