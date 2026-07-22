---
description: Two-axis code review: standards (style, smells, security) and spec (does it match requirements?).
---

# /code-review

## Purpose
Review a diff or set of changes on two independent axes:

1. **Standards** — does the code follow project conventions, avoid common smells, and meet security baselines?
2. **Spec** — does it faithfully implement the intended change?

## How it works

The agent runs two parallel sub-reviews.

### Axis 1: Standards
- Follows project naming conventions?
- No commented-out code, no `console.log` / debug leftovers?
- No `any` / type assertions when avoidable?
- Error handling: are errors surfaced properly (not swallowed)?
- Security: input validation, no SQL injection, no secret exposure?
- No dead code / unused imports?
- Functions do one thing? (single responsibility)
- No deeply nested conditionals? (extract early returns / guards)

### Axis 2: Spec
- Does the diff match the described goal?
- Are all acceptance criteria met?
- Are edge cases from the spec handled?
- Are there untested code paths?

## Output format
```markdown
## Review: {feature/branch name}

### Standards
- [x] Conventions followed
- [ ] **Issue**: {description} — {suggestion}
- [ ] **Issue**: {description} — {suggestion}

### Spec
- [x] All criteria met
- [ ] **Missing**: {what's missing}
- [ ] **Bug**: {description}

### Summary
{1-2 sentence verdict}
```

## When to use
- Before merging any PR / branch
- After `/implement` finishes
- When reviewing someone else's code
- When you want a second pair of eyes on a diff