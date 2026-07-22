---
description: Compact the current session into a handoff document so another agent or session can continue seamlessly.
---

# /handoff

## Purpose
Generate a lightweight handoff document from the current session. Useful when:
- Session is about to be interrupted
- You need to switch agents (Cursor ↔ Claude Code ↔ Codex)
- Task spans multiple sessions
- You want to share context with another developer

## Output
File `HANDFOFF-{YYYY-MM-DD}.md` in project root.

## Template

```markdown
# Handoff: {short title}

**Date**: {YYYY-MM-DD HH:mm}
**Agent**: {model name}
**Session context**: {link to task / issue / PR}

## Status
- [ ] {task} — {progress}, next: {next step}
- [ ] {task} — {progress}, next: {next step}

## Files Changed
- `{path}` — {summary of change}
- `{path}` — {summary of change}

## Key Decisions
1. **{decision}** — {rationale, tradeoffs}
2. **{decision}** — {rationale, tradeoffs}

## Open Questions
- {question}
- {question}

## Next Steps
1. {step}
2. {step}

## Session State
- Branch: `{branch}`
- Uncommitted changes: {yes / no}
- Pending migrations: {yes / no — name}
- Env changes needed: {none / list}
```

## Rules
- No full conversation dump — just decisions and state
- No secrets, tokens, or credentials
- Paths relative to project root
- Keep it under 50 lines