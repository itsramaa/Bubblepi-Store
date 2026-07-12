# Task 1: Project Scaffolding & Config

**Context:** Ini adalah task pertama dari migrasi Bubblepi Store dari Vite+React ke Next.js 15 fullstack.
Repo ada di `~/projects/Bubblepi-Store`. Worktree untuk implementasi ada di `~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration`.
**Semua pekerjaan dilakukan di worktree**, bukan di root repo.

## Global Constraints (berlaku untuk semua task)
- pnpm only (no npm/yarn)
- TypeScript strict mode — no `any`
- All prices in IDR (integer, Rupiah), never USD
- shadcn/ui components only — no daisyui, no @headlessui/react
- Lenis: single instance at root layout only
- Cart items keyed by `variantId` not `productId`
- Order IDs: format `BP-XXXXXXXX` (8 random alphanumeric uppercase)
- Xendit sandbox only — never production keys
- Admin auth: single password via httpOnly JWT cookie (ADMIN_PASSWORD + ADMIN_SECRET env vars)
- Credentials stored plaintext for MVP
- No customer auth — orders accessed by order ID (CUID, unguessable)
- Tax: 11% (PPN Indonesia)
- Webhook validation: x-callback-token header === XENDIT_WEBHOOK_TOKEN env var

## Files to Create/Modify
- `next.config.ts`
- `tailwind.config.ts`
- `app/globals.css`
- `lib/utils.ts`
- `public/logo.png`, `public/cursor.png`, `public/cursor-hover.png`
- `.env.local`
- `tsconfig.json` (verify strict: true)
- `components.json` (shadcn config)

## Steps

- [ ] 1. Masuk ke worktree dan init Next.js 15:
```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration
# Backup old files yang masih dipakai
cp -r src src.old 2>/dev/null || true
cp -r public public.old 2>/dev/null || true
cp package.json package.json.old 2>/dev/null || true
# Init Next.js 15 — jawab semua prompt dengan defaults (TypeScript, App Router, Tailwind, ESLint, no src dir, @/* alias)
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --yes
```

- [ ] 2. Install semua dependencies:
```bash
pnpm add @prisma/client xendit-node resend @react-email/components lenis framer-motion react-icons clsx tailwind-merge jose zod
pnpm add -D prisma
```

- [ ] 3. Initialize shadcn/ui dan add komponen yang dibutuhkan:
```bash
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button card input label select badge sheet dialog separator tabs table textarea dropdown-menu avatar
```

- [ ] 4. Buat `lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "BP-"
  const random = crypto.randomBytes(8)
  for (let i = 0; i < 8; i++) {
    result += chars[random[i] % chars.length]
  }
  return result
}
```

- [ ] 5. Update `tailwind.config.ts` dengan custom colors dan fonts:
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F472B6",
          foreground: "#FFFFFF",
        },
        "bg-light": "#FAFAFA",
        "bg-dark": "#0A0A0A",
        "text-light": "#111827",
        "text-dark": "#F9FAFB",
        success: "#16A34A",
        error: "#DC2626",
        warning: "#D97706",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        cal: ["var(--font-cal-sans)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] 6. Copy public assets dari backup:
```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration
cp public.old/assets/images/logo.png public/ 2>/dev/null || echo "logo not found, skip"
cp public.old/assets/images/cursor.png public/ 2>/dev/null || echo "cursor not found, skip"
cp public.old/assets/images/cursor-hover.png public/ 2>/dev/null || echo "cursor-hover not found, skip"
```

- [ ] 7. Buat `.env.local`:
```env
DATABASE_URL=
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ADMIN_PASSWORD=
ADMIN_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] 8. Pastikan `tsconfig.json` punya `"strict": true`. Kalau tidak ada, tambahkan.

- [ ] 9. Verifikasi build berjalan:
```bash
pnpm build
```

- [ ] Commit:
```bash
git add -A && git commit -m "chore: scaffold Next.js 15 project with TypeScript strict, shadcn/ui, Tailwind"
```

## Report Contract
Tulis laporan ke `~/projects/Bubblepi-Store/.superpowers/sdd/task-1-report.md` dengan format:
```
## Status
DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED

## Commits
<sha> <message>

## Tests
pnpm build: PASS/FAIL

## What was done
- ...

## Concerns (if any)
- ...
```
