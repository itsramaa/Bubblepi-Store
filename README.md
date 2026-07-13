# Bubblepi Store

Premium digital accounts marketplace — Netflix, Spotify, Canva, ChatGPT, dan lainnya.

## Tech Stack

- Next.js 16 (App Router, TypeScript strict)
- shadcn/ui + Tailwind CSS 4 (CSS-based config)
- Prisma 6 + PostgreSQL
- Xendit (QRIS + Virtual Account, sandbox)
- Resend + React Email

## Setup

```bash
# 1. Install deps
pnpm install

# 2. Setup env
cp .env.example .env.local
# Fill in all variables — see Environment Variables table below

# 3. Setup DB
npx prisma migrate dev

# 4. Seed
npx tsx prisma/seed.ts

# 5. Dev
pnpm dev
```

## Deployment (Vercel)

1. Connect repo `holycann/Bubblepi-Store`
2. Framework: Next.js
3. Build command: `prisma generate && next build`
4. Install command: `pnpm install`
5. Set all env vars from `.env.local` on Vercel dashboard
6. Use Vercel Postgres / Neon / Supabase for `DATABASE_URL`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | ✅ | PostgreSQL URL. Append `?pgbouncer=true&connection_limit=1` for Vercel/Neon |
| ADMIN_PASSWORD | ✅ | Admin panel password (min 8 chars) |
| ADMIN_SECRET | ✅ | JWT signing secret (min 32 chars) |
| XENDIT_SECRET_KEY | ✅ | Xendit API key (`xnd_development_` for sandbox, `xnd_production_` for live) |
| XENDIT_WEBHOOK_TOKEN | ✅ | Xendit webhook verification token |
| RESEND_API_KEY | ✅ | Resend email API key |
| RESEND_FROM_EMAIL | ✅ | Sender email address |
| NEXT_PUBLIC_APP_URL | ✅ | Full app URL (e.g. `https://bubblepi-store.vercel.app`) |
| TELEGRAM_BOT_TOKEN | ✅ | Telegram bot token for notifications |
| TELEGRAM_CHAT_ID | ✅ | Telegram chat ID |
| CRON_SECRET | ✅ | Secret for cron job authentication (min 16 chars) |
| NEXT_PUBLIC_SUPPORT_WHATSAPP | ✅ | WhatsApp support number |
| ENCRYPTION_KEY | ✅ | 64-char hex string for AES-256-GCM. Generate: `openssl rand -hex 32` |

## Routes

### Storefront
- `/` — Homepage (hero, featured products, testimonials, FAQ)
- `/products` — Product listing with category/search filter
- `/products/[slug]` — Product detail + variant picker
- `/cart` — Cart page
- `/checkout` — 3-step checkout (data → konfirmasi → pembayaran)
- `/orders/[id]` — Order status + credential reveal

### Admin
- `/admin/login` — Admin login (single password)
- `/admin/dashboard` — Stats + recent orders
- `/admin/products` — Product list + CRUD
- `/admin/orders` — Order list + detail + manual fulfill
- `/admin/stock` — Stock management per variant (bulk add)

### API
- `/api/health` — Health check (DB ping), returns `{ "status": "ok" }`
- `/api/cron/check-expired-orders` — Mark 24h-old PENDING/AWAITING_PAYMENT orders as FAILED
- `/api/cron/retry-emails` — Retry failed email deliveries (max 5 attempts)
- `/api/cron/low-stock-alert` — Email admin when variants drop below 3 units

## Go-Live Checklist

- [ ] Switch Xendit to production: change `XENDIT_SECRET_KEY` from `xnd_development_` to `xnd_production_`
- [ ] Generate `ENCRYPTION_KEY`: `openssl rand -hex 32`
- [ ] Run credential migration: `npx tsx scripts/encrypt-credentials.ts`
- [ ] Verify webhook URL in Xendit dashboard → Settings → Webhooks → set to `https://yourdomain.com/api/payments/webhook`
- [ ] Set all env vars in Vercel dashboard (Settings → Environment Variables)
- [ ] Run Prisma migrations on production DB: `npx prisma migrate deploy`
- [ ] Verify Resend domain DNS (DKIM/SPF) — check Resend dashboard
- [ ] Test full order flow end-to-end (place order, pay via sandbox/production, verify email received)
- [ ] Verify admin login works at `/admin/login`
- [ ] Check `/api/health` returns `{ "status": "ok" }`

## Rollback Plan

- **Vercel**: Enable Automatic Rollback in Production Deployments settings
- **Database**: `npx prisma migrate resolve --rolled-back <migration-name>` + restore from Neon point-in-time recovery
- **Credential encryption**: If ENCRYPTION_KEY is lost, restore DB from backup before migration was run
- **Rate limiting**: In-memory — resets automatically on cold start, no rollback needed

## Notes

- AES-256-GCM credential encryption implemented (Task 6)
- In-memory rate limiting on sensitive endpoints (Task 1)
- Admin: single password, httpOnly JWT cookie 8h
