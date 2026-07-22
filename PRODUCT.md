# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indonesian Gen Z and young adults looking for affordable digital account subscriptions (Capcut Pro, Canva Pro, Spotify, ChatGPT, etc.). Price-sensitive, mobile-first, trust-conscious buyers who need instant fulfillment without friction.

## Product Purpose

Bubblepi Store is a digital account marketplace where buyers purchase shared/individual account subscriptions instantly. It makes premium digital tools accessible at a fraction of the cost, with warranty protection and automated supplier fulfillment.

## Positioning

An instant, trustworthy digital account marketplace with automated supplier integration, warranty system, and multiple payment methods (QRIS, Virtual Account) — unlike informal marketplace listings or individual sellers.

## Operating Context

- Users browse products, select variants (duration), add to cart, checkout with email/name (guest or registered)
- Payment via Xendit (QRIS, VA). After payment confirmed via webhook, order is fulfilled automatically via supplier API or Telegram bot
- Warranty system: active period, max 1x claim with proof image
- Admin dashboard: manage products, variants, stock, suppliers, orders, vouchers, referrals
- Supplier integration: Telegram bot and HTTP API (Sekoloko, Barbar Store)
- Admin can manually fulfill or bulk fulfill orders

## Capabilities and Constraints

- Guest checkout (no account required) with email + name
- Registered users: login, order history, warranty claims, product reviews
- Admin roles: full CRUD on products, variants, stock, suppliers, vouchers, orders, pricelist, referrals
- Vouchers: PERCENT or FIXED, with expiry and max uses
- Referral system: commission on referral order completion
- Abandoned cart recovery cron
- Price drop notifications
- Funnel analytics tracking
- Loading states handled at component level (no route-level loading.tsx)
- Uses Go backend API via `lib/api-client.ts` (not Prisma directly yet)

## Brand Commitments

- Name: Bubblepi Store — "Bubblepi" (no other spelling)
- Voice: Trustworthy, modern, playful — friendly but professional
- Colors: Pink #F4ABC4 (primary), Purple #595B83 (secondary), Navy #333456 (accent), Dark #060930
- Visual style: Airbnb-inspired design system (white canvas, generous whitespace, pill-shaped elements, soft rounded corners)
- Font: Airbnb Cereal VF / Circular system stack
- No loading.tsx files — loading is handled at the component level

## Evidence on Hand

- Full Next.js 16 app with App Router, Tailwind v4, shadcn/ui
- Go backend API at `/api/...` endpoints
- Existing DESIGN.md with Airbnb-inspired design tokens (to be customized with Bubblepi colors)
- 18 shadcn/ui components, ~60 custom components, ~45 pages
- Existing product SVGs in `public/products/`

## Product Principles

1. Trust first — transparent pricing, warranty system, instant fulfillment
2. Mobile-optimized — Indonesian users are mobile-first
3. Frictionless checkout — guest checkout, multiple payment methods, instant delivery
4. Airbnb-grade visual quality — white canvas, generous spacing, thoughtful typography
5. Component-level loading — never show a blank page, always show meaningful skeleton states

## Accessibility & Inclusion

- WCAG AA minimum for text contrast
- Touch targets ≥48px for primary actions
- prefers-reduced-motion respected
- Indonesian language UI