# Task 1 Report: Security & Stability Foundations

**Date:** 2026-07-13  
**Branch:** feat/prod-hardening  
**Commit:** ebf2293  
**Status:** DONE

---

## Admin Route Guard Audit

### Files with missing `requireAdmin()` guards (fixed)

| File | Missing on |
|------|-----------|
| `app/api/admin/logout/route.ts` | POST (no import, no guard) |
| `app/api/admin/orders/route.ts` | GET (imported but never called) |
| `app/api/admin/orders/[id]/route.ts` | GET (no guard); PATCH all 3 paths (no guard); generic PATCH (no status validation) — **CRITICAL** |
| `app/api/admin/orders/bulk-fulfill/route.ts` | POST (imported but never called) |
| `app/api/admin/products/route.ts` | GET + POST (imported but never called) |
| `app/api/admin/products/[id]/route.ts` | GET + PATCH + DELETE (imported but never called) |
| `app/api/admin/reviews/route.ts` | PATCH (imported but never called) |
| `app/api/admin/stock/[id]/route.ts` | PATCH + DELETE (imported but never called) |
| `app/api/admin/stock/bulk-upload/route.ts` | POST (imported but never called) |
| `app/api/admin/stock/route.ts` | GET + POST (imported but never called) |
| `app/api/admin/variants/[id]/route.ts` | PATCH + DELETE (imported but never called) |
| `app/api/admin/variants/route.ts` | GET + POST (imported but never called) |
| `app/api/admin/vouchers/route.ts` | POST + PATCH (imported but never called) |
| `app/api/admin/warranty/route.ts` | PATCH (imported but never called) |

### Files already correctly guarded (no change needed)

- `app/api/admin/auth/route.ts` — POST intentionally unguarded (login route)
- `app/api/admin/orders/export/route.ts` — already guarded
- `app/api/admin/revenue/chart/route.ts` — already guarded
- `app/api/admin/stats/route.ts` — already guarded

### Critical fix: `orders/[id]/route.ts`

- Added `requireAdmin(request)` guard to GET handler
- Added `requireAdmin(request)` guard to all PATCH paths (fulfill, cancel, generic)
- Added status allowlist validation to generic PATCH path:
  ```typescript
  const ALLOWED_STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED", "FAILED", "PENDING_STOCK"] as const
  ```
- Added try/catch error handling to both handlers

---

## New Files Created

| File | Description |
|------|-------------|
| `app/api/health/route.ts` | DB connectivity health check → GET /api/health |
| `app/error.tsx` | Global error boundary (Client Component) |
| `app/not-found.tsx` | 404 page |
| `lib/env.ts` | Zod-based env validation — throws in production on missing/invalid vars |
| `.env.example` | Complete env var template with comments |

---

## Incidental Fix

- `app/api/cron/abandoned-cart/route.ts` — `new Resend(...)` was at module level, causing build failure. Moved inside handler.
- `app/api/cron/renewal-reminder/route.ts` — same pattern, same fix.

---

## Build Output

```
✓ Compiled successfully in 19.3s
✓ TypeScript passed in 14.7s
✓ 36/36 static pages generated
Exit code: 0
```

Pre-existing warning (not introduced by this task):
- `ReferenceError: location is not defined` in `app/(store)/checkout/page.tsx` — SSR browser-globals issue, pre-existing.
- `middleware` file convention deprecation warning — pre-existing.

---

## Commit

```
ebf2293 fix: security hardening — admin guards, health endpoint, env validation
20 files changed, 182 insertions(+), 57 deletions(-)
```

---

## Status: DONE
