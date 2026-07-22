---
description: Test-driven development loop — red, green, refactor. Write a failing test first, then make it pass, then clean up.
---

# /tdd

## Purpose
Build features or fix bugs one vertical slice at a time using the red-green-refactor cycle. Gives the agent constant feedback that the code actually works.

## The Loop

### Phase 1: Red
- Write a **failing test** first
- The test should describe ONE behavior
- Name clearly: `should {expected behavior} when {condition}`
- Make it fail for the right reason (e.g., function doesn't exist yet)
- Do NOT write the implementation yet

### Phase 2: Green
- Write the **minimum code** to make the test pass
- No premature optimization
- No extra features
- If the test passes, stop writing code

### Phase 3: Refactor
- Clean up the code while keeping tests green
- Extract helper functions, rename variables, simplify logic
- Remove duplication
- Check that tests still pass after each refactor

## Guidelines

### Good tests
- Test **one thing** per test
- Descriptive names (`should return error when email is invalid`)
- Isolated: no shared mutable state between tests
- Fast: no network calls, no filesystem I/O in unit tests
- Deterministic: same input → same output every time

### Bad tests
- Testing implementation details instead of behavior
- Over-mocking (mock only external boundaries)
- Flaky tests (timing, random, network-dependent)
- Testing the framework / library

## When to use
Always. Seriously. Use `/tdd` for:
- Any new function or module
- Bug fixes (write a test that reproduces the bug first)
- API endpoints (test request → response)
- Data transformations, validators, business logic

## Framework detection
The agent should auto-detect the test framework from the project:
- Node: `node:test` / `vitest` / `jest`
- Go: `go test`
- Python: `pytest` / `unittest`
- Rust: `cargo test`