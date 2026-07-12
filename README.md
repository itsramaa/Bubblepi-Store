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
# Fill in: DATABASE_URL, XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN,
#          NEXT_PUBLIC_XENDIT_PUBLIC_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL,
#          ADMIN_PASSWORD, ADMIN_SECRET, NEXT_PUBLIC_APP_URL

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

## Notes

- Credentials stored plaintext (`ponytail:` AES-256 encryption post-MVP)
- No rate limiting on API routes (`ponytail:` add post-MVP)
- Admin: single password, httpOnly JWT cookie 8h
