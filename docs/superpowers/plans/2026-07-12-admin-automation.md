# Bubblepi Admin Automation — Cron Jobs & Background Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate operational tasks — stock expiry, order cleanup, fulfillment retries, reporting, renewal reminders, and cart recovery — via standalone TypeScript scripts and Hermes cron jobs with Telegram notifications.

**Architecture:** Each task is a standalone TypeScript script under `scripts/` that imports Prisma client and lib utilities. Scripts are invoked by Hermes cron jobs on defined schedules. All scripts emit Telegram notifications via `lib/telegram.ts`. A shared `scripts/_common.ts` module provides Prisma client singleton and notification helpers.

**Tech Stack:** Next.js 15, TypeScript strict, Prisma 6, PostgreSQL (Neon), Xendit SDK, Resend, shadcn/ui, Tailwind CSS 4, pnpm, Sonner

## Global Constraints
- Working directory: `~/projects/Bubblepi-Store` (main branch)
- Worktree for builds: `~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration`
- Always use `npx next build` (not pnpm build)
- Always sync files from worktree to root repo before committing
- `export const dynamic = "force-dynamic"` required on all DB-querying server pages
- shadcn components: install Radix primitive + write manually (CLI times out)
- Prisma: use `node_modules/.bin/prisma migrate dev --name <name>`
- Build verify: `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`
- Commit format: `git add -A && git commit -m "feat/fix: description" && git push origin main`
- Brand: pink-soft #F4ABC4, purple-dark #595B83, navy #333456, blue-dark #060930. Font Poppins.

---


### Shared Setup: scripts/_common.ts

**Files:**
- Create: `scripts/_common.ts`

- [ ] Create shared script utilities:

```typescript
// scripts/_common.ts
import { PrismaClient } from "@prisma/client";
import { sendTelegram } from "../lib/telegram";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function notify(message: string) {
  try { await sendTelegram(message); } catch (err) { console.error("Telegram notification failed:", err); }
}

export function now() { return new Date(); }
export function hoursAgo(h: number) { return new Date(Date.now() - h * 60 * 60 * 1000); }
export function daysAgo(d: number) { return new Date(Date.now() - d * 24 * 60 * 60 * 1000); }
```

---

### Task 1: Auto-expire stok lewat expiresAt

**Files:**
- Create: `scripts/auto-expire-stock.ts`

**Interfaces:**
- Consumes: AccountStock WHERE status=AVAILABLE AND expiresAt < now
- Produces: Updated status to EXPIRED, Telegram notification

- [ ] Create auto-expire script:

```typescript
// scripts/auto-expire-stock.ts
import { prisma, notify, now } from "./_common";

async function main() {
  const expiredStocks = await prisma.accountStock.findMany({
    where: { status: "AVAILABLE", expiresAt: { lt: now() } },
    include: { variant: { include: { product: true } } },
  });

  if (expiredStocks.length === 0) { console.log("No stock to expire"); return; }

  const result = await prisma.accountStock.updateMany({
    where: { status: "AVAILABLE", expiresAt: { lt: now() } },
    data: { status: "EXPIRED" },
  });

  console.log("Expired " + result.count + " stock entries");

  const affectedOrders = await prisma.accountStock.findMany({
    where: { status: "EXPIRED", orderId: { not: null } },
    include: { variant: { include: { product: true } }, order: { select: { orderNumber: true } } },
  });

  await notify(
    "⏰ Auto-expire: " + result.count + " credentials di-expire" +
    (affectedOrders.length > 0 ? "
⚠️ " + affectedOrders.length + " akun terkait order juga expired" : "")
  );
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
```

- [ ] Register Hermes cron:

```bash
hermes cron create --name "auto-expire-stock" --schedule "0 * * * *" --command "cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx tsx scripts/auto-expire-stock.ts" --description "Expire stock past expiresAt every hour"
```

---

### Task 2: Auto-cancel order AWAITING_PAYMENT > 25 jam

**Files:**
- Create: `scripts/auto-cancel-expired-orders.ts`

- [ ] Create script cancelling orders older than 25h.
- [ ] Register cron: hourly (`0 * * * *`).

---

### Task 3: Auto-cancel order PENDING > 7 hari (cleanup)

**Files:**
- Create: `scripts/auto-cleanup-old-orders.ts`

- [ ] Create script cleaning up PENDING orders older than 7 days.
- [ ] Register cron: daily midnight (`0 0 * * *`).

---

### Task 4: Auto-retry PENDING_STOCK tiap 15 menit

**Files:**
- Create: `scripts/auto-retry-pending-stock.ts`

- [ ] Create script: query PENDING_STOCK orders, check stock availability, call fulfillOrder().
- [ ] Register cron: every 15 minutes (`*/15 * * * *`).

---

### Task 5: Daily revenue report Telegram jam 08.00 WIB

**Files:**
- Create: `scripts/daily-report.ts`

- [ ] Create script: today's revenue, order counts by status, top 3 products, critical stock count.
- [ ] Format as Telegram HTML message.
- [ ] Register cron: daily 01:00 UTC (`0 1 * * *`).

---

### Task 6: Alert stok kritis real-time

**Files:**
- Modify: `lib/order.ts`

- [ ] Add `checkCriticalStock()` function after fulfillment sets DELIVERED status.
- [ ] If any variant stock < 5, send Telegram: "⚠️ Stok Kritis: [produk] [varian] tinggal X unit".

---

### Task 7: Weekly summary Telegram (Senin jam 08.00 WIB)

**Files:**
- Create: `scripts/weekly-summary.ts`

- [ ] Create script: last 7 days revenue, total orders, fulfillment rate, top 5 products, new vs repeat buyers.
- [ ] Register cron: Monday 01:00 UTC (`0 1 * * 1`).

---

### Task 8: Email reminder perpanjangan H-3

**Files:**
- Create: `scripts/renewal-reminder.ts`
- Create: `emails/RenewalReminder.tsx`

- [ ] Create email template.
- [ ] Create script querying AccountStock WHERE expiresAt BETWEEN now AND now+3 days.
- [ ] Deduplicate: max 1 email per customerEmail per day.
- [ ] Send via Resend.
- [ ] Register cron: daily 02:00 UTC (`0 2 * * *`).

---

### Task 9: Abandoned cart recovery cron

**Files:**
- Create: `scripts/abandoned-cart-recovery.ts`

- [ ] Create script querying AbandonedCart WHERE recovered=false AND createdAt < now-1h.
- [ ] Check if order with same email exists in last 2h; skip if yes.
- [ ] Send Resend reminder email; mark as recovered.
- [ ] Register cron: hourly (`0 * * * *`).

---

## Cron Jobs Summary

| # | Name | Schedule | Description |
|---|------|----------|-------------|
| 1 | auto-expire-stock | `0 * * * *` | Expire stock past expiresAt (hourly) |
| 2 | auto-cancel-awaiting-payment | `0 * * * *` | Cancel AWAITING_PAYMENT > 25h (hourly) |
| 3 | auto-cleanup-old-orders | `0 0 * * *` | Cleanup PENDING > 7 days (daily) |
| 4 | auto-retry-pending-stock | `*/15 * * * *` | Retry PENDING_STOCK (15 min) |
| 5 | daily-revenue-report | `0 1 * * *` | Daily report 08:00 WIB |
| 6 | weekly-summary | `0 1 * * 1` | Weekly report Monday 08:00 WIB |
| 7 | renewal-reminder | `0 2 * * *` | H-3 expiry reminders 09:00 WIB |
| 8 | abandoned-cart-recovery | `0 * * * *` | Cart recovery emails (hourly) |

All scripts use `npx tsx` runner. Install tsx:

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration
pnpm add -D tsx
```
#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`
