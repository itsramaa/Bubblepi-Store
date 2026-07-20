# Bubblepi Store Context

## Stack
- Next.js 16, Prisma 6, TypeScript strict, pnpm
- Auth: Xendit webhook + JWT strategy
- Test: node:test + node:assert

## Conventions
- pnpm only — no npm/yarn
- TypeScript strict — no any, no @ts-ignore
- shadcn/ui only — no new UI deps
- Server Actions: tetap 'use server'

## Commands
- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`

## Key Paths
- Entry: `app/`
- Components: `components/`
- API: `app/api/`
- Scripts: `scripts/` (automation TypeScript scripts)
- Prisma: `prisma/schema.prisma`

## Known Quirks
- Auth via Xendit webhook, JWT strategy
- Cron scripts di `scripts/` dijalankan via `npx tsx scripts/[name].ts`
- NVM required untuk npx — source NVM dulu kalau dari shell non-interactive
