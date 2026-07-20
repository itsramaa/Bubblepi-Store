# BubblePI Store — Implementation Plan v2

> **Version:** 2.0  
> **Created:** 2026-07-20  
> **Status:** Draft

**Goal:** Build complete e-commerce for premium accounts with multi-supplier integration, warranty system, and full automation.

**Architecture:** Next.js 16 App Router, PostgreSQL + Prisma, Xendit, Resend, Telegram Bot.

---

## Phase 1: Core Infrastructure

### Task 1.1: Database Schema Update

**Files:**
- `prisma/schema.prisma`

**Steps:**
- [ ] 1. Update Prisma schema with new models (参照 fullspec section 14)
- [ ] 2. Add: `User`, `Product`, `Variant`, `WarrantyOption`, `AccountStock`, `Order`, `Warranty`, `WarrantyClaim`, `Supplier`
- [ ] 3. Add enums: `Role`, `StockStatus`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `WarrantyStatus`, `ClaimStatus`, `SupplierType`
- [ ] 4. Run `pnpm db:migrate`
- [ ] 5. Run `pnpm db:generate`

---

### Task 1.2: Auth System

**Files:**
- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `lib/auth.ts`
- `middleware.ts` (update)

**Steps:**
- [ ] 1. Create `lib/auth.ts` with JWT helpers
- [ ] 2. Create register API (`POST /api/auth/register`)
- [ ] 3. Create login API (`POST /api/auth/login`)
- [ ] 4. Create logout API (`POST /api/auth/logout`)
- [ ] 5. Update middleware for auth routes
- [ ] 6. Add admin auth middleware
- [ ] 7. Test: guest, user, admin login

---

### Task 1.3: Product & Stock Management

**Files:**
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`
- `app/api/admin/stock/route.ts`
- `lib/stock.ts`

**Steps:**
- [ ] 1. Create GET products API (public)
- [ ] 2. Create GET product/[id] API (public)
- [ ] 3. Create stock management lib
- [ ] 4. Create admin stock API (list, update status)
- [ ] 5. Add stock alert logic

---

### Task 1.4: Order System

**Files:**
- `app/api/checkout/route.ts`
- `app/api/order/[id]/route.ts`
- `app/api/user/orders/route.ts`
- `lib/order.ts`

**Steps:**
- [ ] 1. Create checkout API (guest + user)
- [ ] 2. Add: create order, calculate total, validate stock
- [ ] 3. Create order detail API (owner/admin)
- [ ] 4. Create user orders list API
- [ ] 5. Add order status update logic
- [ ] 6. Test: guest checkout, user checkout

---

### Task 1.5: Payment Integration (Xendit)

**Files:**
- `lib/payment/xendit.ts`
- `app/api/webhooks/xendit/route.ts`
- `app/api/payment/create-invoice/route.ts`

**Steps:**
- [ ] 1. Create Xendit lib (`lib/payment/xendit.ts`)
- [ ] 2. Create invoice creation API
- [ ] 3. Create webhook handler
- [ ] 4. Handle: PAID, EXPIRED, FAILED statuses
- [ ] 5. Trigger auto-order on payment success
- [ ] 6. Test webhook with Xendit sandbox

---

### Task 1.6: Supplier Integration (Adapter Pattern)

**Files:**
- `lib/suppliers/index.ts`
- `lib/suppliers/base.ts`
- `lib/suppliers/telegram-bot.ts`
- `lib/suppliers/api-http.ts`
- `lib/suppliers/barbar-store.ts`
- `lib/suppliers/sekolokopoii.ts`
- `scripts/sync-suppliers.ts`

**Steps:**
- [ ] 1. Create base supplier interface
- [ ] 2. Create Telegram bot adapter
- [ ] 3. Create HTTP API adapter
- [ ] 4. Implement BarbarStore adapter
- [ ] 5. Implement Sekolokopoii adapter
- [ ] 6. Create supplier factory
- [ ] 7. Add retry logic with exponential backoff
- [ ] 8. Add fallback logic (switch supplier)
- [ ] 9. Create polling logic

---

### Task 1.7: Auto-Order Flow

**Files:**
- `lib/auto-order.ts`
- `app/api/orders/[id]/auto-fulfill/route.ts`

**Steps:**
- [ ] 1. Create auto-order orchestrator
- [ ] 2. Add: lock stock (AVAILABLE → HOLD)
- [ ] 3. Add: send request to supplier
- [ ] 4. Add: handle response (success/fail)
- [ ] 5. Add: auto-retry logic (3x)
- [ ] 6. Add: notify admin on failure
- [ ] 7. Add: notify customer on delay
- [ ] 8. Integrate with payment webhook

---

### Task 1.8: Delivery System

**Files:**
- `lib/delivery.ts`
- `emails/delivery-email.tsx`
- `app/api/delivery/send/route.ts`

**Steps:**
- [ ] 1. Create delivery email template
- [ ] 2. Add email sending via Resend
- [ ] 3. Create auto-delivery function
- [ ] 4. Add: update stock (HOLD → SOLD)
- [ ] 5. Add: start warranty timer if applicable
- [ ] 6. Test: email delivery

---

### Task 1.9: Warranty System

**Files:**
- `app/api/warranty/claim/route.ts`
- `app/api/warranty/[id]/route.ts`
- `lib/warranty.ts`

**Steps:**
- [ ] 1. Create warranty options in DB
- [ ] 2. Add warranty selection in checkout
- [ ] 3. Create warranty claim API
- [ ] 4. Add: upload proof image
- [ ] 5. Create warranty detail API
- [ ] 6. Add: proof expiry check (1×24 jam)
- [ ] 7. Add: cron job for expiry check
- [ ] 8. Test: claim submission

---

### Task 1.10: Warranty Admin Review

**Files:**
- `app/api/admin/warranty/route.ts`
- `app/api/admin/warranty/[id]/review/route.ts`

**Steps:**
- [ ] 1. Create list pending claims API
- [ ] 2. Create claim detail API
- [ ] 3. Create review API (approve/reject)
- [ ] 4. Add: auto-replacement on approve
- [ ] 5. Add: send notification to customer
- [ ] 6. Add: audit log for admin action

---

### Task 1.11: Manual Order Input

**Files:**
- `app/api/admin/manual-order/route.ts`
- `app/admin/orders/new/page.tsx`

**Steps:**
- [ ] 1. Create manual order API
- [ ] 2. Add: input fields (nama, email, produk, variant, garansi, harga, bukti)
- [ ] 3. Add: create order with status DELIVERED
- [ ] 4. Add: create warranty if applicable
- [ ] 5. Create admin UI for manual order

---

### Task 1.12: Security Implementation

**Files:**
- `lib/crypto.ts`
- `middleware/rate-limit.ts`
- `lib/validators.ts`

**Steps:**
- [ ] 1. Create encryption lib (AES-256)
- [ ] 2. Encrypt credentials before storage
- [ ] 3. Decrypt when delivering
- [ ] 4. Add rate limiting middleware
- [ ] 5. Add Zod validators for all forms
- [ ] 6. Add CSP headers

---

## Phase 2: Data & Sync

### Task 2.1: Google Sheets Integration

**Files:**
- `lib/sync/sheets.ts`
- `scripts/sync-prices.ts`

**Steps:**
- [ ] 1. Setup Google Sheets API credentials
- [ ] 2. Create sheets sync lib
- [ ] 3. Add: parse sheet values
- [ ] 4. Add: upsert products/variants
- [ ] 5. Add: sync warranty prices
- [ ] 6. Add: handle new/deleted products

---

### Task 2.2: Cron Jobs

**Files:**
- `scripts/cron/price-sync.ts`
- `scripts/cron/stock-alert.ts`
- `scripts/cron/warranty-expiry.ts`
- `scripts/cron/proof-expiry.ts`
- `scripts/cron/daily-report.ts`
- `scripts/cron/monthly-report.ts`

**Steps:**
- [ ] 1. Setup cron job runner
- [ ] 2. Create price sync job (every 2 hours)
- [ ] 3. Create stock alert job (every 15 min)
- [ ] 4. Create warranty expiry job (every 1 hour)
- [ ] 5. Create proof expiry job (every 10 min)
- [ ] 6. Create daily report job (08:00)
- [ ] 7. Create monthly report job (1st of month 09:00)

---

### Task 2.3: Price List Generator

**Files:**
- `app/api/admin/pricelist/route.ts`
- `app/admin/pricelist/page.tsx`
- `lib/pricelist.ts`

**Steps:**
- [ ] 1. Create pricelist generation lib
- [ ] 2. Add: filter by products
- [ ] 3. Add: options (pasaran/promo)
- [ ] 4. Add: export PDF
- [ ] 5. Add: export Image
- [ ] 6. Add: copy link
- [ ] 7. Create admin UI

---

## Phase 3: Customer Features

### Task 3.1: User Dashboard

**Files:**
- `app/dashboard/page.tsx`
- `app/dashboard/orders/[id]/page.tsx`
- `app/dashboard/warranty/page.tsx`

**Steps:**
- [ ] 1. Create dashboard layout
- [ ] 2. Add: order history list
- [ ] 3. Add: active warranties
- [ ] 4. Create order detail page
- [ ] 5. Add: warranty claim button
- [ ] 6. Add: claim form modal

---

### Task 3.2: Testimonial System

**Files:**
- `app/api/testimonials/route.ts`
- `app/api/testimonials/[id]/route.ts`
- `components/testimonial-card.tsx`

**Steps:**
- [ ] 1. Create testimonials table/model
- [ ] 2. Create submit testimonial API (user only)
- [ ] 3. Create list testimonials API
- [ ] 4. Create testimonial component
- [ ] 5. Add: rating (1-5 stars)
- [ ] 6. Add: featured/top testimonials

---

### Task 3.3: Dark/Light Mode

**Files:**
- `app/providers.tsx`
- `components/theme-toggle.tsx`
- `context/theme-context.tsx`

**Steps:**
- [ ] 1. Create theme context
- [ ] 2. Add: toggle component
- [ ] 3. Add: persistence (localStorage)
- [ ] 4. Update tailwind config for dark mode
- [ ] 5. Apply theme to all components

---

## Phase 4: Admin & Automation

### Task 4.1: Admin Dashboard

**Files:**
- `app/admin/page.tsx`
- `components/admin/stats-card.tsx`

**Steps:**
- [ ] 1. Create dashboard layout
- [ ] 2. Add: revenue today
- [ ] 3. Add: orders count
- [ ] 4. Add: warranty claims count
- [ ] 5. Add: critical stock alerts
- [ ] 6. Add: recent orders list

---

### Task 4.2: Admin Order Management

**Files:**
- `app/admin/orders/page.tsx`
- `app/admin/orders/[id]/page.tsx`

**Steps:**
- [ ] 1. Create orders list with filters
- [ ] 2. Add: search by order ID
- [ ] 3. Add: filter by status
- [ ] 4. Add: filter by date
- [ ] 5. Create order detail page
- [ ] 6. Add: manual fulfill action

---

### Task 4.3: Admin Product Management

**Files:**
- `app/admin/products/page.tsx`

**Steps:**
- [ ] 1. Create products list
- [ ] 2. Add: toggle display (active/inactive)
- [ ] 3. Add: view product details
- [ ] 4. Add: sync from suppliers button

---

### Task 4.4: Admin Supplier Management

**Files:**
- `app/admin/suppliers/page.tsx`
- `app/admin/suppliers/[id]/edit/page.tsx`

**Steps:**
- [ ] 1. Create suppliers list
- [ ] 2. Add: add new supplier
- [ ] 3. Add: edit supplier config
- [ ] 4. Add: toggle active/inactive
- [ ] 5. Add: test connection

---

### Task 4.5: Telegram Notifications

**Files:**
- `lib/notifications/telegram.ts`
- `scripts/notify-admin.ts`

**Steps:**
- [ ] 1. Setup Telegram bot
- [ ] 2. Create notification lib
- [ ] 3. Add: new order notification
- [ ] 4. Add: payment confirmed notification
- [ ] 5. Add: supplier failed notification
- [ ] 6. Add: stock alert notification
- [ ] 7. Add: new claim notification
- [ ] 8. Add: daily/monthly report

---

### Task 4.6: Reports Generation

**Files:**
- `lib/reports.ts`
- `app/api/admin/reports/daily/route.ts`
- `app/api/admin/reports/monthly/route.ts`

**Steps:**
- [ ] 1. Create report generation lib
- [ ] 2. Add: daily report (revenue, orders, claims)
- [ ] 3. Add: monthly report
- [ ] 4. Add: format for Telegram
- [ ] 5. Integrate with cron jobs

---

## Phase 5: PWA & Polish

### Task 5.1: PWA Configuration

**Files:**
- `next.config.ts`
- `public/manifest.json`
- `public/icons/`

**Steps:**
- [ ] 1. Install `next-pwa`
- [ ] 2. Update next.config.ts
- [ ] 3. Create manifest.json
- [ ] 4. Create app icons (all sizes)
- [ ] 5. Add to home screen prompt

---

### Task 5.2: Performance Optimization

**Steps:**
- [ ] 1. Optimize images (next/image)
- [ ] 2. Add lazy loading
- [ ] 3. Optimize fonts
- [ ] 4. Add caching headers
- [ ] 5. Lighthouse audit (target: 90+)

---

### Task 5.3: Testing & QA

**Steps:**
- [ ] 1. Unit tests for utilities
- [ ] 2. API integration tests
- [ ] 3. E2E tests for checkout flow
- [ ] 4. Warranty claim flow test
- [ ] 5. Admin operations test

---

## Task Dependencies

```
Phase 1:
├── 1.1 Schema ─────────────────┐
├── 1.2 Auth ───────────────────┤
├── 1.3 Products ───────────────┤
├── 1.4 Order ──────────────────┤
├── 1.5 Payment ────────────────┼──► 1.7 Auto-Order ──► 1.8 Delivery
├── 1.6 Supplier ───────────────┘              │
├── 1.9 Warranty ──────────────────────────────┤
├── 1.10 Warranty Review ──────────────────────┤
├── 1.11 Manual Order ──────────────────────────┤
└── 1.12 Security ──────────────────────────────┘

Phase 2:
├── 2.1 Sheets ───────► 2.2 Cron ──► 2.3 Price List

Phase 3:
├── 3.1 Dashboard ───► 3.2 Testimonials
└── 3.3 Theme

Phase 4:
├── 4.1 Dashboard ──► 4.2 Orders ──► 4.3 Products ──► 4.4 Suppliers
├── 4.5 Notifications (depends on all above)
└── 4.6 Reports (depends on 4.1-4.5)

Phase 5:
├── 5.1 PWA ──► 5.2 Performance ──► 5.3 Testing
```

---

## Quick Start (Recommended Order)

**Week 1 - Foundation:**
1. Task 1.1: Database Schema
2. Task 1.2: Auth System
3. Task 1.12: Security (encryption first!)

**Week 2 - Core Commerce:**
4. Task 1.3: Products
5. Task 1.4: Order
6. Task 1.5: Payment
7. Task 1.8: Delivery

**Week 3 - Supplier Integration:**
8. Task 1.6: Supplier Adapter
9. Task 1.7: Auto-Order

**Week 4 - Warranty:**
10. Task 1.9: Warranty System
11. Task 1.10: Warranty Review
12. Task 1.11: Manual Order

**Week 5 - Data:**
13. Task 2.1: Sheets Sync
14. Task 2.2: Cron Jobs
15. Task 2.3: Price List

**Week 6 - Customer:**
16. Task 3.1: Dashboard
17. Task 3.2: Testimonials
18. Task 3.3: Dark/Light Mode

**Week 7 - Admin:**
19. Task 4.1: Admin Dashboard
20. Task 4.2: Orders Management
21. Task 4.3: Products Management
22. Task 4.4: Suppliers Management

**Week 8 - Automation:**
23. Task 4.5: Telegram Notifications
24. Task 4.6: Reports

**Week 9 - Polish:**
25. Task 5.1: PWA
26. Task 5.2: Performance
27. Task 5.3: Testing

---

## Environment Variables

```env
# Database
DATABASE_URL=

# Xendit
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Google Sheets
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
GOOGLE_SHEETS_REFRESH_TOKEN=
GOOGLE_SHEET_ID=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=

# Auth
ADMIN_PASSWORD=
ADMIN_SECRET=
JWT_SECRET=

# Encryption
ENCRYPTION_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Acceptance Criteria per Phase

### Phase 1 (Core)
- [ ] User can register/login
- [ ] Admin can login
- [ ] Products display correctly
- [ ] Guest can checkout
- [ ] Payment via Xendit works
- [ ] Auto-order to supplier triggers
- [ ] Email delivery works
- [ ] Warranty can be purchased
- [ ] Warranty claim works
- [ ] Manual order works
- [ ] Credentials encrypted

### Phase 2 (Data)
- [ ] Prices sync from Google Sheets
- [ ] Cron jobs run correctly
- [ ] Price list generates

### Phase 3 (Customer)
- [ ] User dashboard works
- [ ] Testimonials display
- [ ] Dark/Light mode works

### Phase 4 (Admin)
- [ ] Dashboard shows stats
- [ ] Orders manageable
- [ ] Products manageable
- [ ] Suppliers manageable
- [ ] Telegram notifications work
- [ ] Reports generate

### Phase 5 (Polish)
- [ ] PWA installable
- [ ] Performance 90+
- [ ] Tests pass