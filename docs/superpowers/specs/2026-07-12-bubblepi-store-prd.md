# Bubblepi Store — Product Requirements Document (PRD)

**Version:** 1.0.0
**Date:** 2026-07-12
**Author:** Hermes Agent × Ramadhan
**Status:** Draft — Pending Implementation

---

## 1. Overview

Bubblepi Store adalah toko digital berbasis web untuk menjual akun-akun layanan digital sharing (Netflix, Spotify, Canva, ChatGPT, dll). Tujuan MVP ini adalah mengubah storefront demo menjadi sistem e-commerce yang fully operational: customer bisa browse produk, checkout, bayar via Xendit (QRIS + Virtual Account), dan menerima akun digital mereka via email — semua otomatis tanpa intervensi manual.

### 1.1 Problem Statement

Kondisi saat ini:
- Frontend sudah ada (Vite + React) tapi semua data mock, checkout fake, tidak ada payment real
- Tidak ada backend — zero persistence, zero automation
- Admin tidak bisa manage stok, order, atau produk tanpa edit kode langsung

### 1.2 Success Criteria

- [ ] Customer bisa checkout dan bayar via QRIS atau Virtual Account (Xendit sandbox)
- [ ] Sistem otomatis assign dan kirim akun digital ke email customer setelah payment confirmed
- [ ] Admin bisa manage produk, varian, stok akun, dan order via dashboard
- [ ] Zero manual fulfillment untuk order yang stoknya tersedia
- [ ] Order status bisa dicek customer via halaman tracking

---

## 2. Scope

### In Scope (MVP)
- Migrasi frontend Vite → Next.js 15 (App Router) + TypeScript
- Backend via Next.js API Routes
- Integrasi Xendit sandbox: QRIS + Virtual Account
- Sistem stok akun digital (pre-stock, auto-assign)
- Email delivery via Resend setelah payment confirmed
- Admin dashboard: CRUD produk, varian, stok akun, lihat & manage orders
- Order status page untuk customer
- UI/UX upgrade: shadcn/ui + Tailwind, accessible, responsive

### Out of Scope (post-MVP)
- WhatsApp delivery
- Auth customer (login/register)
- Promo/voucher system
- Review & rating
- Analytics dashboard
- Multi-admin / role-based access
- Xendit production (live money)

---

## 3. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| UI Components | shadcn/ui + Tailwind CSS 3 |
| UI Animations | Framer Motion |
| Database | PostgreSQL (VPS existing) |
| ORM | Prisma |
| Payment | Xendit SDK (sandbox) |
| Email | Resend + React Email |
| Font | Inter (body) + Cal Sans (headings) |
| Deployment | Vercel (frontend + API routes) |
| Package Manager | pnpm |

---

## 4. Architecture

### 4.1 Repo Structure

```
bubblepi-store/
├── app/
│   ├── (store)/                    # Public storefront
│   │   ├── page.tsx                # HomePage
│   │   ├── products/
│   │   │   ├── page.tsx            # ProductsPage
│   │   │   └── [slug]/page.tsx     # ProductDetailPage
│   │   ├── cart/page.tsx           # CartPage
│   │   ├── checkout/page.tsx       # CheckoutPage
│   │   └── orders/[id]/page.tsx    # OrderStatusPage (NEW)
│   ├── (admin)/                    # Admin dashboard
│   │   ├── layout.tsx              # Admin layout + auth guard
│   │   ├── dashboard/page.tsx      # Overview stats
│   │   ├── products/
│   │   │   ├── page.tsx            # Product list
│   │   │   ├── new/page.tsx        # Create product
│   │   │   └── [id]/page.tsx       # Edit product
│   │   ├── orders/
│   │   │   ├── page.tsx            # Order list
│   │   │   └── [id]/page.tsx       # Order detail
│   │   └── stock/
│   │       ├── page.tsx            # Stock overview
│   │       └── [variantId]/page.tsx# Manage account stock per variant
│   └── api/
│       ├── orders/
│       │   └── route.ts            # POST /api/orders — create order
│       ├── payments/
│       │   ├── create/route.ts     # POST /api/payments/create — Xendit invoice
│       │   └── webhook/route.ts    # POST /api/payments/webhook — Xendit callback
│       ├── orders/[id]/
│       │   └── route.ts            # GET /api/orders/:id — order status
│       └── admin/
│           ├── products/route.ts   # CRUD products
│           ├── variants/route.ts   # CRUD variants
│           ├── stock/route.ts      # CRUD account stock
│           └── orders/route.ts     # List + update orders
├── components/
│   ├── store/                      # Storefront-specific components
│   │   ├── Navbar.tsx
│   │   ├── HeroCarousel.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CheckoutStepper.tsx
│   │   └── OrderStatus.tsx
│   ├── admin/                      # Admin-specific components
│   │   ├── StatsCard.tsx
│   │   ├── OrderTable.tsx
│   │   ├── StockManager.tsx
│   │   └── ProductForm.tsx
│   └── ui/                         # shadcn/ui primitives (auto-generated)
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── xendit.ts                   # Xendit SDK wrapper
│   ├── mailer.ts                   # Resend wrapper
│   ├── order.ts                    # Order fulfillment logic
│   ├── auth.ts                     # Admin session (simple secret token)
│   └── utils.ts                    # cn(), formatPrice(), generateOrderId()
├── emails/
│   ├── OrderConfirmation.tsx       # React Email template
│   └── AccountDelivery.tsx         # React Email template
├── prisma/
│   └── schema.prisma
├── middleware.ts                    # Admin route protection
└── types/
    └── index.ts                    # Shared TypeScript types
```

### 4.2 Data Flow — Happy Path

```
Customer → Add to Cart → Checkout (contact info) →
POST /api/orders → POST /api/payments/create (Xendit invoice) →
Customer bayar (QRIS / VA) →
Xendit webhook → POST /api/payments/webhook →
  1. Validate signature
  2. Update order status = PAID
  3. Assign account stock (auto)
  4. Send email via Resend
  5. Mark stock as DELIVERED
Customer → GET /orders/:id → lihat status + akun yang diterima
```

---

## 5. Database Schema (Prisma)

```prisma
model Product {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String
  image       String
  category    String
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  variants    Variant[]
}

model Variant {
  id        String         @id @default(cuid())
  productId String
  name      String         // "1p2u", "Private", "Family", dll
  duration  String         // "1 bulan", "3 bulan"
  price     Int            // dalam Rupiah (IDR)
  product   Product        @relation(fields: [productId], references: [id])
  stock     AccountStock[]
  orderItems OrderItem[]
}

model AccountStock {
  id          String    @id @default(cuid())
  variantId   String
  credentials String    // "email:password" atau JSON encrypted
  status      StockStatus @default(AVAILABLE)
  orderId     String?
  assignedAt  DateTime?
  createdAt   DateTime  @default(now())
  variant     Variant   @relation(fields: [variantId], references: [id])
  order       Order?    @relation(fields: [orderId], references: [id])
}

enum StockStatus {
  AVAILABLE
  ASSIGNED
  DELIVERED
  EXPIRED
}

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique  // "BP-XXXXXXXX"
  customerEmail String
  customerName  String
  status        OrderStatus @default(PENDING)
  paymentMethod String?     // "qris" | "bca_va" | "mandiri_va" | dll
  xenditInvoiceId String?
  xenditPaymentUrl String?
  subtotal      Int
  tax           Int
  total         Int
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  paidAt        DateTime?
  items         OrderItem[]
  stocks        AccountStock[]
}

enum OrderStatus {
  PENDING          // order dibuat, belum bayar
  AWAITING_PAYMENT // invoice Xendit sudah dibuat
  PAID             // Xendit webhook confirmed
  FULFILLED        // akun sudah dikirim via email
  FAILED           // payment expired / cancelled
  PENDING_STOCK    // paid tapi stok habis
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  variantId String
  quantity  Int
  price     Int     // snapshot harga saat checkout
  order     Order   @relation(fields: [orderId], references: [id])
  variant   Variant @relation(fields: [variantId], references: [id])
}
```

---

## 6. API Endpoints

### 6.1 Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/orders` | Buat order baru, return `orderId` |
| `POST` | `/api/payments/create` | Buat Xendit invoice, return `paymentUrl` + `invoiceId` |
| `POST` | `/api/payments/webhook` | Xendit callback — update order, fulfill, kirim email |
| `GET`  | `/api/orders/:id` | Cek status order + items (untuk customer tracking) |

### 6.2 Admin Endpoints (protected)

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/admin/products` | List semua produk / Buat produk baru |
| `GET/PATCH/DELETE` | `/api/admin/products/:id` | Detail / Edit / Hapus produk |
| `GET/POST` | `/api/admin/variants` | List varian / Buat varian |
| `GET/POST` | `/api/admin/stock` | List stok / Tambah stok akun |
| `PATCH` | `/api/admin/stock/:id` | Update status stok |
| `GET` | `/api/admin/orders` | List semua order + filter status |
| `PATCH` | `/api/admin/orders/:id` | Update status order manual |

### 6.3 Xendit Webhook Payload

```typescript
// Xendit mengirim ke POST /api/payments/webhook
{
  id: string              // xendit invoice id
  external_id: string     // order.orderNumber kita
  status: "PAID" | "EXPIRED"
  payment_method: string  // "QRIS" | "BCA" | "MANDIRI" dll
  paid_amount: number
  paid_at: string         // ISO datetime
}
```

**Webhook validation:** Setiap request harus ada header `x-callback-token` yang divalidasi dengan `XENDIT_WEBHOOK_TOKEN` dari env.

---

## 7. Payment Integration (Xendit)

### 7.1 Flow QRIS

```
POST /api/payments/create
  body: { orderId, amount, customerEmail, customerName }
→ Xendit createInvoice({ external_id: orderNumber, amount, customer })
→ Return: { invoice_url, qr_string, id }
→ Frontend redirect ke invoice_url atau render QR
```

### 7.2 Flow Virtual Account

```
POST /api/payments/create
  body: { orderId, amount, customerEmail, customerName, bank: "BCA"|"MANDIRI"|"BNI"|"BRI" }
→ Xendit createFixedVirtualAccount({ external_id, bank_code, name, expected_amount })
→ Return: { account_number, bank_code, expected_amount, expiration_date }
→ Frontend tampilkan nomor VA + instruksi
```

### 7.3 Webhook Handler Logic

```typescript
// lib/order.ts
async function fulfillOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const stock = await db.accountStock.findFirst({
        where: { variantId: item.variantId, status: 'AVAILABLE' }
      })

      if (!stock) {
        // Tandai order sebagai PENDING_STOCK, notif admin
        await db.order.update({ where: { id: orderId }, data: { status: 'PENDING_STOCK' } })
        await notifyAdminStockEmpty(item.variantId)
        return
      }

      await db.accountStock.update({
        where: { id: stock.id },
        data: { status: 'ASSIGNED', orderId, assignedAt: new Date() }
      })
    }
  }

  await db.order.update({ where: { id: orderId }, data: { status: 'FULFILLED' } })
  await sendOrderEmail(order)
}
```

---

## 8. Email Templates (Resend + React Email)

### 8.1 Order Confirmation

Trigger: order dibuat (status AWAITING_PAYMENT)
Content:
- Order number
- Ringkasan item + harga
- Instruksi pembayaran (VA number / link QRIS)
- Link ke order tracking page

### 8.2 Account Delivery

Trigger: order status berubah ke FULFILLED
Content:
- Order number
- Per item: nama produk, nama varian, credentials (email + password)
- Instruksi penggunaan akun
- Peringatan: jangan share credentials
- Link ke order tracking page

---

## 9. UI/UX Specification

### 9.1 Design System

**Component Library:** shadcn/ui (Radix UI primitives + Tailwind)
**Animations:** Framer Motion (tasteful, gak lebay)
**Smooth Scroll:** Lenis — satu instance di root layout, tidak duplikat

**Color Palette:**
```
Primary:   #7C3AED (purple-600) — CTA, active states
Secondary: #F472B6 (pink-400)  — accent, hover
Background light: #FAFAFA
Background dark:  #0A0A0A
Text light: #111827
Text dark:  #F9FAFB
Success: #16A34A
Error:   #DC2626
Warning: #D97706
```

**Typography:**
```
Heading: Cal Sans — 4 size scale (4xl, 3xl, 2xl, xl), weight 600-700
Body: Inter — 16px, line-height 1.6
Code: JetBrains Mono (untuk display credentials di email & order page)
```

**Spacing:** 4px base unit — 4, 8, 12, 16, 24, 32, 48, 64, 96

### 9.2 Layout Patterns per Page

| Page | Layout Pattern | Rationale |
|------|---------------|-----------|
| HomePage | Full-bleed hero + card grid + sticky nav | Landing page marketing |
| ProductsPage | Filter sidebar + card grid | Listing pattern |
| ProductDetailPage | Split screen (image left, detail right) | Product focus |
| CartPage | Content + sticky order summary | E-commerce standard |
| CheckoutPage | Stepper (3 steps) + sticky summary | Reduce cognitive load |
| OrderStatusPage | Centered timeline + status badge | Clarity |
| Admin Dashboard | Sidebar + bento grid stats | Admin panel standard |
| Admin Orders | Sidebar + data table + filter | Data management |

### 9.3 Component Specifications

**Navbar:**
- Sticky, blur backdrop (`backdrop-blur-md bg-white/80`)
- Max 5 items: Home, Products, Categories, FAQ, Cart (icon + badge)
- Mobile: hamburger → slide-in sheet (shadcn Sheet)
- Dark mode toggle (ThemeToggle) di ujung kanan
- Cart item count badge — real-time dari CartContext

**ProductCard:**
- Image 4:3 ratio, `object-cover`, `loading="lazy"`
- Variant selector (pill buttons) langsung di card
- Harga dalam IDR: `Rp 20.000`
- Stok indicator: badge hijau "Tersedia" / kuning "Stok Terbatas (< 5)" / merah "Habis"
- CTA: "Tambah ke Keranjang" (primary) + "Beli Sekarang" (ghost)
- Hover: subtle scale + shadow (Framer Motion)

**CartDrawer:**
- shadcn Sheet dari kanan
- List item dengan quantity stepper
- Subtotal sticky di bottom
- Empty state: ilustrasi + CTA "Lihat Produk"

**CheckoutStepper:**
- Step 1: Info Customer (nama, email)
- Step 2: Pilih Payment Method (QRIS / VA — pilih bank)
- Step 3: Payment Instructions + status polling
- Progress bar di top, disabled back navigation setelah payment dimulai

**OrderStatusPage:**
- Timeline vertikal: Pesanan Dibuat → Menunggu Pembayaran → Pembayaran Dikonfirmasi → Akun Dikirim
- Auto-refresh setiap 10 detik via `setInterval` + `/api/orders/:id`, berhenti otomatis setelah status terminal (FULFILLED / FAILED) atau setelah 30 menit (timeout)
- Setelah FULFILLED: tampilkan credentials dalam card dengan tombol copy
- Credentials di-blur default, reveal on click (privacy)

**Admin Dashboard:**
- Bento grid: Total Revenue (hari ini), Total Orders, Pending Orders, Stok Kritis
- Recent orders table (5 terakhir)
- Quick actions: Tambah Stok, Lihat Order Pending

### 9.4 Accessibility

- Semua interactive elements punya `focus-visible` ring
- Touch targets minimum 44×44px
- Contrast ratio ≥ 4.5:1 untuk body text
- Form inputs: label di atas (bukan floating), error message di bawah field
- Status badges: jangan pakai warna saja — sertakan teks
- `aria-live` region untuk cart count update
- Keyboard navigable: dropdown, modal, stepper semua bisa keyboard

### 9.5 Responsive Breakpoints

```
mobile:  < 640px  — single column, bottom nav (Home, Products, Cart)
tablet:  640-1024px — 2 column grid, hamburger nav
desktop: > 1024px — 3-4 column grid, full navbar
```

---

## 10. Admin Authentication

Simple — tidak perlu full auth system untuk MVP:

```
Admin login: /admin/login
  → POST body: { password }
  → Validate against ADMIN_PASSWORD env var
  → Set httpOnly cookie: admin_session (JWT signed with ADMIN_SECRET, 8h expiry)
  → middleware.ts intercept /admin/* routes, verify cookie
```

**Env vars:**
```
ADMIN_PASSWORD=<strong-password>
ADMIN_SECRET=<jwt-signing-secret>
```

Tidak ada user table untuk admin. Satu password, satu admin. Upgrade ke NextAuth post-MVP kalau perlu multi-admin.

---

## 11. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/bubblepi

# Xendit
XENDIT_SECRET_KEY=xnd_development_...
XENDIT_WEBHOOK_TOKEN=...
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xp_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@bubblepi.store

# Admin Auth
ADMIN_PASSWORD=...
ADMIN_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://bubblepi-store.vercel.app
```

---

## 12. Pages & Routes

### 12.1 Storefront

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Hero, featured products, categories, testimonials, FAQ |
| `/products` | `ProductsPage` | Grid semua produk + filter kategori + search |
| `/products/[slug]` | `ProductDetailPage` | Detail produk, pilih varian, add to cart |
| `/cart` | `CartPage` | Keranjang belanja |
| `/checkout` | `CheckoutPage` | 3-step checkout: info → payment → konfirmasi |
| `/orders/[id]` | `OrderStatusPage` | Tracking order + credentials setelah fulfilled |

### 12.2 Admin

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `AdminLoginPage` | Login admin |
| `/admin/dashboard` | `AdminDashboardPage` | Overview stats + recent orders |
| `/admin/products` | `AdminProductsPage` | List + CRUD produk |
| `/admin/products/new` | `AdminProductFormPage` | Buat produk baru |
| `/admin/products/[id]` | `AdminProductFormPage` | Edit produk |
| `/admin/orders` | `AdminOrdersPage` | List semua order + filter + detail |
| `/admin/orders/[id]` | `AdminOrderDetailPage` | Detail order + manual fulfill |
| `/admin/stock` | `AdminStockPage` | Overview stok per varian |
| `/admin/stock/[variantId]` | `AdminStockManagerPage` | Tambah / lihat / hapus stok akun |

---

## 13. Error Handling

| Scenario | Handling |
|----------|----------|
| Stok habis saat checkout | Block checkout, tampilkan "Stok habis" di cart item |
| Stok habis setelah payment (race condition) | Order status = PENDING_STOCK, email notif ke admin, customer dapat email konfirmasi manual |
| Xendit webhook duplicate | Idempotent check: skip jika `order.status` sudah PAID/FULFILLED |
| Xendit webhook invalid signature | Return 401, log ke Vercel |
| Payment expired | Webhook `status: EXPIRED` → update order status = FAILED |
| Email delivery gagal | Log error, jangan fail webhook response (Xendit retry logic tidak kena) |
| `JSON.parse` localStorage error | try-catch, fallback ke empty cart |

---

## 14. Security

- Xendit webhook divalidasi via `x-callback-token` header
- Admin routes dilindungi httpOnly JWT cookie via `middleware.ts`
- Credentials akun di database: plain text untuk MVP, enkripsi AES-256 post-MVP (`ponytail: credentials stored plaintext — upgrade to AES-256 encryption with CREDENTIALS_SECRET env var`)
- Tidak ada customer auth — order diakses via order ID (UUID, tidak guessable)
- Semua env vars via Vercel environment, tidak di-commit
- `NEXT_PUBLIC_*` hanya untuk non-sensitive public config

---

## 15. Migration Plan (Vite → Next.js)

1. **Init Next.js project** di folder yang sama, copy komponen dan data
2. **Port komponen** satu per satu: ubah import path, hapus React Router, pakai Next.js `Link` dan `useRouter`
3. **Hapus dead dependencies**: daisyui, swiper, react-scroll, @types/react, @types/react-dom
4. **Install shadcn/ui** + setup theme sesuai color palette
5. **Fix critical bugs** dari evaluasi: CartContext `total`, Lenis duplikat, currency IDR konsisten
6. **Tambah Prisma** + schema + seed data dari `src/data/products.js`
7. **Integrasi Xendit** + webhook
8. **Email templates** dengan Resend + React Email
9. **Admin dashboard**
10. **Deploy ke Vercel** + connect PostgreSQL

---

## 16. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load (LCP) | < 2.5 detik di mobile 4G |
| Checkout flow completion | < 3 menit dari add to cart |
| Webhook response time | < 3 detik (Xendit timeout 30s) |
| Uptime | 99.9% (Vercel SLA) |
| Mobile-first | Semua halaman usable di 375px |
| Dark mode | Semua halaman support dark mode |

---

## 17. Out of Scope Decisions (Rationale)

| Feature | Keputusan | Alasan |
|---------|-----------|--------|
| Customer auth | Skip | Overkill untuk MVP — order tracked by ID |
| Voucher/promo | Skip | YAGNI |
| WhatsApp delivery | Skip | Email cukup untuk MVP |
| Xendit production | Skip | Sandbox dulu, production setelah QA |
| Credentials encryption | Plaintext dulu | Tambah AES-256 setelah core flow verified |
| Rate limiting | Skip | Tambah post-launch via Vercel middleware |

---

*PRD ini adalah living document. Update setiap kali ada keputusan arsitektural baru.*
