# Bubblepi Store — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Vite+React storefront to Next.js 15 fullstack e-commerce with real payment (Xendit), auto email delivery (Resend), and admin dashboard.

**Architecture:** Next.js 15 App Router monorepo. Public storefront + admin dashboard under one repo. API routes handle all backend logic. PostgreSQL via Prisma. Xendit for QRIS + Virtual Account payments. Resend + React Email for automated account delivery.

**Tech Stack:** Next.js 15, TypeScript (strict), shadcn/ui + Tailwind CSS 3, Framer Motion, Prisma + PostgreSQL, Xendit SDK, Resend + React Email, pnpm, Vercel

## Global Constraints
- pnpm only (no npm/yarn)
- TypeScript strict mode — no `any`
- All prices in IDR (integer, Rupiah), never USD
- shadcn/ui components only — no daisyui, no @headlessui/react
- Lenis: single instance at root layout only
- Cart items keyed by `variantId` not `productId`
- Order IDs: format `BP-XXXXXXXX` (8 random alphanumeric uppercase)
- Xendit sandbox only — never production keys
- Admin auth: single password via httpOnly JWT cookie (ADMIN_PASSWORD + ADMIN_SECRET env vars)
- Credentials stored plaintext for MVP (ponytail: upgrade to AES-256 post-MVP)
- No customer auth — orders accessed by order ID (CUID, unguessable)
- Tax: 11% (PPN Indonesia)
- Webhook validation: x-callback-token header === XENDIT_WEBHOOK_TOKEN env var

---

## Task 1: Project Scaffolding & Config

**Files:**
- `next.config.ts`
- `tailwind.config.ts`
- `app/globals.css`
- `lib/utils.ts`
- `lib/validators.ts` (zod schemas for forms)
- `public/logo.png`, `public/cursor.png`, `public/cursor-hover.png`
- `.env.local`
- `tsconfig.json` (overridden by Next.js init, verify strict)
- `components.json` (shadcn config)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: project skeleton, `cn()` utility, `formatPrice()`, `generateOrderId()` used everywhere

**Steps:**

- [ ] 1. Create new Next.js 15 project inside existing repo:
```bash
cd ~/projects/Bubblepi-Store
# Backup old project files
cp -r src src.old 2>/dev/null
cp -r public public.old 2>/dev/null
cp package.json package.json.old 2>/dev/null
# Init Next.js 15 with TypeScript, App Router, src dir OFF (flat app/)
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --no-turbopack --yes
```

- [ ] 2. Install all dependencies:
```bash
pnpm add @prisma/client xendit-node resend @react-email/components lenis framer-motion react-icons clsx tailwind-merge jose zod
pnpm add -D prisma
```

- [ ] 3. Initialize shadcn/ui:
```bash
pnpm dlx shadcn@latest init --defaults
# Then add commonly used components
pnpm dlx shadcn@latest add button card input label select badge sheet dialog separator tabs toast table textarea dropdown-menu avatar
```

- [ ] 4. Create `lib/utils.ts` with core utilities:
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

- [ ] 5. Configure `tailwind.config.ts` with custom colors:
```typescript
import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

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
        primary: "#7C3AED",
        secondary: "#F472B6",
        background: {
          light: "#FAFAFA",
          dark: "#0A0A0A",
        },
        text: {
          light: "#111827",
          dark: "#F9FAFB",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F472B6",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        cal: ["var(--font-cal-sans)"],
        mono: ["var(--font-jetbrains)"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
export default config
```

- [ ] 6. Setup fonts in `app/globals.css` and copy old public assets:
```bash
cp public.old/logo.png public/
cp public.old/cursor.png public/
cp public.old/cursor-hover.png public/
```

- [ ] 7. Create `.env.local` with all required env vars (empty values):
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

- [ ] 8. Verify TypeScript strict mode in `tsconfig.json`:
```bash
cat tsconfig.json | grep strict
# Should show "strict": true
```

- [ ] Commit: `git add -A && git commit -m "chore: scaffold Next.js 15 project with TypeScript strict, shadcn/ui, Tailwind"`

---

## Task 2: Database Schema & Prisma Setup

**Files:**
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `lib/db.ts`

**Interfaces:**
- Consumes: Task 1 (project skeleton, utils)
- Produces: Database schema, seed data, Prisma client singleton used by all API routes and pages

**Steps:**

- [ ] 1. Initialize Prisma:
```bash
pnpm prisma init
```

- [ ] 2. Write `prisma/schema.prisma` with full schema:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum StockStatus {
  AVAILABLE
  ASSIGNED
  DELIVERED
  EXPIRED
}

enum OrderStatus {
  PENDING
  AWAITING_PAYMENT
  PAID
  FULFILLED
  FAILED
  PENDING_STOCK
}

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
  id        String        @id @default(cuid())
  productId String
  name      String
  duration  String
  price     Int           // IDR integer
  product   Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  stock     AccountStock[]
  orderItems OrderItem[]
}

model AccountStock {
  id          String      @id @default(cuid())
  variantId   String
  credentials String      // plaintext for MVP (ponytail: AES-256 post-MVP)
  status      StockStatus @default(AVAILABLE)
  orderId     String?
  assignedAt  DateTime?
  createdAt   DateTime    @default(now())
  variant     Variant     @relation(fields: [variantId], references: [id], onDelete: Cascade)
  order       Order?      @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([variantId, status])
  @@index([orderId])
}

model Order {
  id                String      @id @default(cuid())
  orderNumber       String      @unique // BP-XXXXXXXX
  customerEmail     String
  customerName      String
  status            OrderStatus @default(PENDING)
  paymentMethod     String?     // "QRIS" | "VA"
  xenditInvoiceId   String?
  xenditPaymentUrl  String?
  subtotal          Int         // IDR integer
  tax               Int         // IDR integer
  total             Int         // IDR integer
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  paidAt            DateTime?
  items             OrderItem[]
  stocks            AccountStock[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  variantId String
  quantity  Int
  price     Int     // price snapshot at time of order
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant   Variant @relation(fields: [variantId], references: [id])
}
```

- [ ] 3. Run Prisma migration:
```bash
# Make sure PostgreSQL is running and DATABASE_URL is set
pnpm prisma generate
pnpm prisma migrate dev --name init
```

- [ ] 4. Write `prisma/seed.ts` with 6 products from old `src/data/products.js`:
```typescript
import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

const products = [
  {
    name: "Netflix",
    slug: "netflix",
    description: "Akses streaming Netflix premium dengan harga terjangkau.",
    image: "/images/products/netflix.jpg",
    category: "streaming",
    variants: [
      { name: "1P 2U (1 Bulan)", duration: "1 Bulan", price: 20000 },
      { name: "1P 1U (1 Bulan)", duration: "1 Bulan", price: 25000 },
      { name: "Private (1 Bulan)", duration: "1 Bulan", price: 110000 },
    ],
  },
  {
    name: "Canva",
    slug: "canva",
    description: "Canva Pro untuk desain profesional.",
    image: "/images/products/canva.jpg",
    category: "design",
    variants: [
      { name: "Invite (1 Bulan)", duration: "1 Bulan", price: 5000 },
      { name: "Private (1 Bulan)", duration: "1 Bulan", price: 10000 },
    ],
  },
  {
    name: "ChatGPT",
    slug: "chatgpt",
    description: "ChatGPT Plus untuk produktivitas maksimal.",
    image: "/images/products/chatgpt.jpg",
    category: "ai",
    variants: [
      { name: "Sharing (1 Bulan)", duration: "1 Bulan", price: 50000 },
    ],
  },
  {
    name: "Spotify",
    slug: "spotify",
    description: "Spotify Premium tanpa iklan.",
    image: "/images/products/spotify.jpg",
    category: "streaming",
    variants: [
      { name: "Family (1 Bulan)", duration: "1 Bulan", price: 15000 },
      { name: "Individual (1 Bulan)", duration: "1 Bulan", price: 25000 },
    ],
  },
  {
    name: "Adobe Creative Cloud",
    slug: "adobe-creative-cloud",
    description: "Akses lengkap Adobe Creative Cloud.",
    image: "/images/products/adobe.jpg",
    category: "design",
    variants: [
      { name: "Photography (1 Bulan)", duration: "1 Bulan", price: 30000 },
      { name: "Complete (1 Bulan)", duration: "1 Bulan", price: 75000 },
    ],
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    description: "Midjourney AI untuk generasi gambar.",
    image: "/images/products/midjourney.jpg",
    category: "ai",
    variants: [
      { name: "Basic (1 Bulan)", duration: "1 Bulan", price: 45000 },
      { name: "Standard (1 Bulan)", duration: "1 Bulan", price: 65000 },
    ],
  },
]

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        image: product.image,
        category: product.category,
        variants: {
          create: product.variants,
        },
      },
    })
  }
  console.log("Seed completed successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] 5. Create `lib/db.ts` Prisma singleton:
```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] 6. Run seed:
```bash
pnpm prisma db seed
```

- [ ] Commit: `git add -A && git commit -m "feat(db): add Prisma schema, seed data, and db singleton"`

---

## Task 3: Types & Shared Utilities

**Files:**
- `types/index.ts`
- `lib/utils.ts` (extend with validation schemas)
- `lib/auth.ts`
- `middleware.ts`

**Interfaces:**
- Consumes: Task 2 (schema types from Prisma generate)
- Produces: Shared types, auth utilities, route protection middleware

**Steps:**

- [ ] 1. Create `types/index.ts`:
```typescript
import type { Prisma } from "@prisma/client"

// Cart
export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantName: string
  price: number
  quantity: number
  duration: string
}

// Product with variants (for display)
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true }
}>

// Order with items (for detail page)
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: { include: { variant: true } }
    stocks: true
  }
}>

// Variant with stock counts
export type VariantWithStock = Prisma.VariantGetPayload<{
  include: {
    product: { select: { name: true; slug: true; image: true } }
    stock: true
  }
}>

// Admin stats
export interface AdminStats {
  revenueToday: number
  totalOrders: number
  pendingOrders: number
  criticalStock: number // variants with < 5 available stock
}

// Checkout form data
export interface CheckoutFormData {
  customerName: string
  customerEmail: string
  paymentMethod: "QRIS" | "VA"
  bankCode?: string // for VA: BCA, BRI, BNI, PERMATA
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
```

- [ ] 2. Create `lib/auth.ts`:
```typescript
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const ADMIN_SECRET = new TextEncoder().encode(process.env.ADMIN_SECRET!)
const COOKIE_NAME = "admin-token"
const EXPIRY = "8h"

export async function signAdminToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(ADMIN_SECRET)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, ADMIN_SECRET)
    return true
  } catch {
    return false
  }
}

export function setAdminCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    },
  }
}

export function getAdminTokenFromHeaders(headers: Headers): string | null {
  const cookie = headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(/admin-token=([^;]+)/)
  return match?.[1] ?? null
}
```

- [ ] 3. Create `middleware.ts` for route protection:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes except login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin-token")?.value
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth") {
    const token = request.cookies.get("admin-token")?.value
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
```

- [ ] 4. Add `lib/validators.ts` for form validation:
```typescript
import { z } from "zod"

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nama harus minimal 2 karakter"),
  customerEmail: z.string().email("Email tidak valid"),
  paymentMethod: z.enum(["QRIS", "VA"]),
  bankCode: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  image: z.string().url(),
  category: z.string().min(1),
  isActive: z.boolean(),
})

export const variantSchema = z.object({
  productId: z.string().cuid(),
  name: z.string().min(1),
  duration: z.string().min(1),
  price: z.number().int().positive(),
})

export const stockItemSchema = z.object({
  variantId: z.string().cuid(),
  credentials: z.string().min(1, "Credentials tidak boleh kosong"),
})
```

- [ ] Commit: `git add -A && git commit -m "feat: add shared types, auth utilities, middleware, and validators"`

---

## Task 4: Admin Auth

**Files:**
- `app/(admin)/login/page.tsx`
- `app/api/admin/auth/route.ts`
- `app/api/admin/logout/route.ts`

**Interfaces:**
- Consumes: Task 3 (auth.ts, validators, middleware)
- Produces: Admin authentication flow (login page, API endpoints, cookie management)

**Steps:**

- [ ] 1. Create `app/(admin)/login/page.tsx`:
```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push("/admin/dashboard")
    } else {
      setError("Password salah")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] 2. Create `app/api/admin/auth/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { signAdminToken, setAdminCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const token = await signAdminToken()
  const cookie = setAdminCookie(token)

  const response = NextResponse.json({ success: true })
  response.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, unknown>)
  return response
}
```

- [ ] 3. Create `app/api/admin/logout/route.ts`:
```typescript
import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete("admin-token")
  return response
}
```

- [ ] 4. Verify flow works:
```bash
# Start dev server
pnpm dev
# Navigate to http://localhost:3000/admin
# Should redirect to /admin/login
# Enter wrong password → error shown
# Enter correct password (from .env.local) → redirect to /admin/dashboard
```

- [ ] Commit: `git add -A && git commit -m "feat: admin auth with password login, JWT cookie, and middleware protection"`

---

## Task 5: Public API Routes

**Files:**
- `app/api/orders/route.ts`
- `app/api/orders/[id]/route.ts`
- `app/api/payments/create/route.ts`
- `app/api/payments/webhook/route.ts`
- `lib/xendit.ts`
- `lib/mailer.ts`
- `lib/order.ts`

**Interfaces:**
- Consumes: Task 1 (generateOrderId, formatPrice), Task 2 (db, Prisma schema), Task 3 (types, validators)
- Produces: Order creation, payment initiation, webhook handling, email sending, order fulfillment logic

**Steps:**

- [ ] 1. Create `lib/xendit.ts`:
```typescript
import Xendit from "xendit-node"

const xenditClient = new Xendit({ key: process.env.XENDIT_SECRET_KEY! })

export async function createInvoice(params: {
  orderId: string
  orderNumber: string
  amount: number
  paymentMethod: "QRIS" | "VA"
  bankCode?: string
  customerName: string
  customerEmail: string
}) {
  const { Invoice } = xenditClient

  const invoiceData = {
    externalID: params.orderNumber,
    amount: params.amount,
    payerEmail: params.customerEmail,
    description: `Bubblepi Store - ${params.orderNumber}`,
    currency: "IDR" as const,
    paymentMethod: [params.paymentMethod],
    paymentMethodConfigurationDetails: params.paymentMethod === "VA" && params.bankCode
      ? { allowedBins: undefined } // let Xendit handle bank code
      : undefined,
    successRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    failureRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
  }

  const invoice = await Invoice.createInvoice({ data: invoiceData })
  return invoice
}
```

- [ ] 2. Create `lib/mailer.ts`:
```typescript
import { Resend } from "resend"
import OrderConfirmationEmail from "@/emails/OrderConfirmation"
import AccountDeliveryEmail from "@/emails/AccountDelivery"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(params: {
  to: string
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentUrl: string
  orderId: string
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Konfirmasi Pesanan ${params.orderNumber}`,
    react: OrderConfirmationEmail({
      orderNumber: params.orderNumber,
      items: params.items,
      total: params.total,
      paymentUrl: params.paymentUrl,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    }),
  })
}

export async function sendAccountDelivery(params: {
  to: string
  orderNumber: string
  items: Array<{ name: string; credentials: string[] }>
  orderId: string
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Akun Anda Sudah Siap! ${params.orderNumber}`,
    react: AccountDeliveryEmail({
      orderNumber: params.orderNumber,
      items: params.items,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    }),
  })
}
```

- [ ] 3. Create `lib/order.ts` — fulfillment logic:
```typescript
import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"

export async function fulfillOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { variant: true } },
    },
  })

  if (!order) throw new Error("Order not found")
  if (order.status === "FULFILLED") return

  let allAssigned = true
  const deliveredItems: Array<{ name: string; credentials: string[] }> = []

  for (const item of order.items) {
    const credentialsList: string[] = []

    for (let i = 0; i < item.quantity; i++) {
      // Find first AVAILABLE stock for this variant
      const stock = await db.accountStock.findFirst({
        where: {
          variantId: item.variantId,
          status: "AVAILABLE",
        },
        orderBy: { createdAt: "asc" },
      })

      if (!stock) {
        allAssigned = false
        // Mark order as PENDING_STOCK — admin needs to add more stock
        await db.order.update({
          where: { id: orderId },
          data: { status: "PENDING_STOCK" },
        })
        continue
      }

      // Assign stock
      await db.accountStock.update({
        where: { id: stock.id },
        data: {
          status: "ASSIGNED",
          orderId: orderId,
          assignedAt: new Date(),
        },
      })

      credentialsList.push(stock.credentials)
    }

    if (credentialsList.length > 0) {
      deliveredItems.push({
        name: `${item.variant.product.name} - ${item.variant.name}`,
        credentials: credentialsList,
      })
    }
  }

  if (allAssigned) {
    await db.order.update({
      where: { id: orderId },
      data: { status: "FULFILLED", paidAt: new Date() },
    })

    // Send delivery email
    await sendAccountDelivery({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      items: deliveredItems,
      orderId: order.id,
    })
  }
}
```

- [ ] 4. Create `app/api/orders/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateOrderId } from "@/lib/utils"
import { checkoutSchema } from "@/lib/validators"

const TAX_RATE = 0.11 // 11% PPN Indonesia

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, items } = body // items: Array<{ variantId, quantity }>

    // Validate
    if (!customerName || !customerEmail || !items?.length) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Fetch variant details for pricing
    const variantIds = items.map((i: { variantId: string }) => i.variantId)
    const variants = await db.variant.findMany({
      where: { id: { in: variantIds } },
    })

    // Calculate subtotal
    let subtotal = 0
    const orderItems = items.map((item: { variantId: string; quantity: number }) => {
      const variant = variants.find((v) => v.id === item.variantId)
      if (!variant) throw new Error(`Variant ${item.variantId} not found`)
      subtotal += variant.price * item.quantity
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.price,
      }
    })

    const tax = Math.round(subtotal * TAX_RATE)
    const total = subtotal + tax

    // Create order
    const orderNumber = generateOrderId()
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        subtotal,
        tax,
        total,
        status: "PENDING",
        items: { create: orderItems },
      },
      include: { items: true },
    })

    return NextResponse.json({
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 })
  }
}
```

- [ ] 5. Create `app/api/orders/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: true } },
      stocks: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: order })
}
```

- [ ] 6. Create `app/api/payments/create/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createInvoice } from "@/lib/xendit"
import { sendOrderConfirmation } from "@/lib/mailer"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order sudah diproses" }, { status: 400 })
    }

    const body = await request.json()
    const { paymentMethod, bankCode } = body

    // Create Xendit invoice
    const invoice = await createInvoice({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod,
      bankCode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
    })

    // Update order
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "AWAITING_PAYMENT",
        paymentMethod,
        xenditInvoiceId: invoice.id,
        xenditPaymentUrl: invoice.invoiceUrl,
      },
    })

    // Send confirmation email
    await sendOrderConfirmation({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      items: [], // TODO: fetch order items
      total: order.total,
      paymentUrl: invoice.invoiceUrl ?? "",
      orderId: order.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: invoice.invoiceUrl,
        invoiceId: invoice.id,
      },
    })
  } catch (error) {
    console.error("Payment create error:", error)
    return NextResponse.json({ error: "Gagal membuat pembayaran" }, { status: 500 })
  }
}
```

- [ ] 7. Create `app/api/payments/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

export async function POST(request: NextRequest) {
  try {
    // Validate webhook token
    const token = request.headers.get("x-callback-token")
    if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { external_id, status } = body

    // external_id is the orderNumber (BP-XXXXXXXX)
    const order = await db.order.findFirst({
      where: { orderNumber: external_id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (status === "PAID") {
      await db.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      })
      await fulfillOrder(order.id)
    } else if (status === "EXPIRED" || status === "FAILED") {
      await db.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
```

- [ ] 8. Verify API routes:
```bash
pnpm dev
# Test POST /api/orders with curl
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","customerEmail":"test@test.com","items":[{"variantId":"test","quantity":1}]}'
```

- [ ] Commit: `git add -A && git commit -m "feat: public API routes — orders, payments, Xendit, Resend, fulfillment"`

---

## Task 6: Admin API Routes

**Files:**
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/api/admin/variants/route.ts`
- `app/api/admin/variants/[id]/route.ts`
- `app/api/admin/stock/route.ts`
- `app/api/admin/stock/[id]/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/orders/[id]/route.ts`

**Interfaces:**
- Consumes: Task 2 (db), Task 3 (validators), Task 4 (admin auth middleware protects all /api/admin/*)
- Produces: Full CRUD for products, variants, stock, orders — consumed by admin dashboard (Task 12)

**Steps:**

- [ ] 1. Create `app/api/admin/products/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { productSchema } from "@/lib/validators"

// GET: list all products
export async function GET() {
  const products = await db.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: products })
}

// POST: create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = productSchema.parse(body)
    const product = await db.product.create({ data: parsed })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
```

- [ ] 2. Create `app/api/admin/products/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: product })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const product = await db.product.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: product })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] 3. Create `app/api/admin/variants/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { variantSchema } from "@/lib/validators"

export async function GET() {
  const variants = await db.variant.findMany({
    include: { product: { select: { name: true, slug: true } }, stock: true },
  })
  return NextResponse.json({ success: true, data: variants })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = variantSchema.parse(body)
    const variant = await db.variant.create({ data: parsed })
    return NextResponse.json({ success: true, data: variant }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
```

- [ ] 4. Create `app/api/admin/variants/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const variant = await db.variant.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: variant })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.variant.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] 5. Create `app/api/admin/stock/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stockItemSchema } from "@/lib/validators"

export async function GET() {
  const stock = await db.accountStock.findMany({
    include: { variant: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: stock })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = stockItemSchema.parse(body)
    const item = await db.accountStock.create({ data: parsed })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
```

- [ ] 6. Create `app/api/admin/stock/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const item = await db.accountStock.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: item })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.accountStock.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] 7. Create `app/api/admin/orders/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const where = status ? { status: status as never } : {}

  const orders = await db.order.findMany({
    where,
    include: { items: { include: { variant: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: orders })
}
```

- [ ] 8. Create `app/api/admin/orders/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: true } },
      stocks: true,
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: order })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Manual fulfill action
  if (body.action === "fulfill") {
    await fulfillOrder(id)
    return NextResponse.json({ success: true })
  }

  // Status update
  const order = await db.order.update({ where: { id }, data: { status: body.status } })
  return NextResponse.json({ success: true, data: order })
}
```

- [ ] Commit: `git add -A && git commit -m "feat: admin API routes — products, variants, stock, orders CRUD"`

---

## Task 7: Email Templates

**Files:**
- `emails/OrderConfirmation.tsx`
- `emails/AccountDelivery.tsx`

**Interfaces:**
- Consumes: Task 5 (mailer.ts imports these templates)
- Produces: Email templates rendered by React Email, sent via Resend

**Steps:**

- [ ] 1. Create `emails/OrderConfirmation.tsx`:
```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Hr,
} from "@react-email/components"

interface OrderConfirmationProps {
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentUrl: string
  trackingUrl: string
}

export default function OrderConfirmationEmail({
  orderNumber,
  items,
  total,
  paymentUrl,
  trackingUrl,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Bubblepi Store - Pesanan {orderNumber}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#FAFAFA" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <Heading style={{ color: "#7C3AED", textAlign: "center" }}>
            Bubblepi Store
          </Heading>
          <Heading as="h2">Konfirmasi Pesanan {orderNumber}</Heading>
          <Text>Terima kasih! Pesanan Anda sudah diterima.</Text>

          {items.map((item, i) => (
            <Text key={i}>
              {item.name} x{item.quantity} - Rp {item.price.toLocaleString("id-ID")}
            </Text>
          ))}

          <Hr />
          <Text style={{ fontWeight: "bold" }}>
            Total: Rp {total.toLocaleString("id-ID")}
          </Text>

          <Button
            href={paymentUrl}
            style={{
              backgroundColor: "#7C3AED",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Bayar Sekarang
          </Button>

          <Text style={{ marginTop: 20 }}>
            <Link href={trackingUrl}>Lacak Status Pesanan</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] 2. Create `emails/AccountDelivery.tsx`:
```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from "@react-email/components"

interface AccountDeliveryProps {
  orderNumber: string
  items: Array<{ name: string; credentials: string[] }>
  trackingUrl: string
}

export default function AccountDeliveryEmail({
  orderNumber,
  items,
  trackingUrl,
}: AccountDeliveryProps) {
  return (
    <Html>
      <Head />
      <Preview>Bubblepi Store - Akun Anda Sudah Siap! {orderNumber}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#FAFAFA" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <Heading style={{ color: "#7C3AED", textAlign: "center" }}>
            Bubblepi Store
          </Heading>
          <Heading as="h2">Akun Anda Sudah Siap! 🎉</Heading>
          <Text>Pesanan {orderNumber} sudah selesai diproses.</Text>

          {items.map((item, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
              {item.credentials.map((cred, j) => (
                <Text
                  key={j}
                  style={{
                    fontFamily: "monospace",
                    backgroundColor: "#F3F4F6",
                    padding: 8,
                    borderRadius: 4,
                    wordBreak: "break-all",
                  }}
                >
                  {cred}
                </Text>
              ))}
            </div>
          ))}

          <Hr />
          <Text style={{ fontWeight: "bold", color: "#DC2626" }}>
            ⚠️ Jangan bagikan credentials ini ke orang lain!
          </Text>
          <Text style={{ fontWeight: "bold" }}>
            Simpan credentials ini di tempat aman. Kami TIDAK menyimpan backup.
          </Text>

          <Text>
            <Link href={trackingUrl}>Lacak Status Pesanan</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] 3. Verify email templates compile:
```bash
pnpm exec tsc --noEmit emails/OrderConfirmation.tsx
pnpm exec tsc --noEmit emails/AccountDelivery.tsx
```

- [ ] Commit: `git add -A && git commit -m "feat: React Email templates — order confirmation and account delivery"`

---

## Task 8: Root Layout & Providers

**Files:**
- `app/layout.tsx`
- `app/(store)/layout.tsx`
- `app/(admin)/layout.tsx`
- `components/store/Navbar.tsx`
- `components/store/Footer.tsx`
- `context/ThemeContext.tsx`
- `context/CartContext.tsx`
- `components/store/CartSheet.tsx` (mobile cart sidebar)

**Interfaces:**
- Consumes: Task 1 (fonts, Tailwind config), Task 3 (types), Task 7 (emails — referenced in nav links)
- Produces: Layouts, navigation, cart context, theme context — used by all pages (Tasks 9-12)

**Steps:**

- [ ] 1. Create `context/ThemeContext.tsx`:
```tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({ theme: "dark", toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

- [ ] 2. Create `context/CartContext.tsx` — keyed by variantId (FIX old bug):
```tsx
"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { CartItem } from "@/types"

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTax: () => number
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const TAX_RATE = 0.11

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from localStorage safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart")
      if (saved) setItems(JSON.parse(saved))
    } catch {
      // corrupted localStorage — clear
      localStorage.removeItem("cart")
    }
  }, [])

  // Save to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items))
    } catch {
      // quota exceeded — ignore
    }
  }, [items])

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId)
      if (existing) {
        return prev.map((i) =>
          i.variantId === newItem.variantId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const getSubtotal = useCallback(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])
  const getTax = useCallback(() => Math.round(getSubtotal() * TAX_RATE), [getSubtotal])
  const getTotal = useCallback(() => getSubtotal() + getTax(), [getSubtotal, getTax])
  const getItemCount = useCallback(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, getSubtotal, getTax, getTotal, getItemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
```

- [ ] 3. Create `app/layout.tsx` with fonts, Lenis (single instance), providers:
```tsx
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"
import { ThemeProvider } from "@/context/ThemeContext"
import { CartProvider } from "@/context/CartProvider"
import LenisProvider from "@/components/LenisProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })
const calSans = localFont({
  src: "../../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal-sans",
})

export const metadata: Metadata = {
  title: "Bubblepi Store",
  description: "Premium digital accounts with affordable prices",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} ${calSans.variable} font-sans`}>
        <ThemeProvider>
          <CartProvider>
            <LenisProvider />
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] 4. Create `components/LenisProvider.tsx` — single instance only:
```tsx
"use client"

import { useEffect } from "react"
import Lenis from "lenis"

export default function LenisProvider() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return null
}
```

- [ ] 5. Create `app/(store)/layout.tsx`:
```tsx
import Navbar from "@/components/store/Navbar"
import Footer from "@/components/store/Footer"

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
```

- [ ] 6. Create `app/(admin)/layout.tsx`:
```tsx
import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
```

- [ ] 7. Create `components/store/Navbar.tsx` — port from old, use Next.js Link:
```tsx
"use client"

import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useTheme } from "@/context/ThemeContext"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Sun, Moon, Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const { getItemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Produk" },
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-cal text-xl font-bold text-primary">
          Bubblepi
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-lg" onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] 8. Create `components/store/Footer.tsx`:
```tsx
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-background mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-cal text-lg font-bold text-primary">Bubblepi Store</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Premium digital accounts with affordable prices.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Links</h4>
            <div className="flex flex-col gap-1 text-sm">
              <Link href="/" className="hover:text-primary">Home</Link>
              <Link href="/products" className="hover:text-primary">Produk</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Kontak</h4>
            <p className="text-sm text-muted-foreground">support@bubblepi.store</p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          © 2026 Bubblepi Store. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
```

- [ ] Commit: `git add -A && git commit -m "feat: root layouts, Navbar, Footer, CartContext, ThemeContext, Lenis provider"`

---

## Task 9: Storefront Pages — Static

**Files:**
- `app/(store)/page.tsx`
- `app/(store)/products/page.tsx`
- `app/(store)/products/[slug]/page.tsx`
- `components/store/HeroCarousel.tsx`
- `components/store/ProductCard.tsx`
- `components/store/CategorySection.tsx`
- `components/store/FeaturedProducts.tsx`
- `components/store/TestimonialsSection.tsx`
- `components/store/FAQSection.tsx`
- `components/store/FilterSidebar.tsx`

**Interfaces:**
- Consumes: Task 2 (db for product queries), Task 3 (types), Task 8 (layouts, cart context)
- Produces: Public storefront pages — product listing, detail page, homepage

**Steps:**

- [ ] 1. Create `components/store/ProductCard.tsx`:
```tsx
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import type { ProductWithVariants } from "@/types"

interface ProductCardProps {
  product: ProductWithVariants
}

export default function ProductCard({ product }: ProductCardProps) {
  const minPrice = Math.min(...product.variants.map((v) => v.price))

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary">{product.category}</Badge>
            <span className="font-bold text-primary">Mulai {formatPrice(minPrice)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] 2. Create homepage `app/(store)/page.tsx`:
```tsx
import { db } from "@/lib/db"
import HeroCarousel from "@/components/store/HeroCarousel"
import FeaturedProducts from "@/components/store/FeaturedProducts"
import CategorySection from "@/components/store/CategorySection"
import TestimonialsSection from "@/components/store/TestimonialsSection"
import FAQSection from "@/components/store/FAQSection"

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    take: 6,
  })

  return (
    <div>
      <HeroCarousel />
      <FeaturedProducts products={products} />
      <CategorySection />
      <TestimonialsSection />
      <FAQSection />
    </div>
  )
}
```

- [ ] 3. Create `app/(store)/products/page.tsx` — server component with DB fetch:
```tsx
import { db } from "@/lib/db"
import ProductCard from "@/components/store/ProductCard"
import FilterSidebar from "@/components/store/FilterSidebar"
import { searchParamsCache } from "@/lib/searchParams"

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search } = await searchParams

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Produk Kami</h1>
      <div className="flex gap-8">
        <FilterSidebar />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] 4. Create `app/(store)/products/[slug]/page.tsx` — product detail with variant selector:
```tsx
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import AddToCartButton from "@/components/store/AddToCartButton"

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params

  const product = await db.product.findUnique({
    where: { slug },
    include: { variants: true },
  })

  if (!product) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square relative rounded-lg overflow-hidden">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        </div>
        <div>
          <Badge className="mb-4">{product.category}</Badge>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-4">{product.description}</p>

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Pilih Varian:</h2>
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <AddToCartButton
                  key={variant.id}
                  variant={variant}
                  product={product}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] 5. Create supporting components (HeroCarousel, CategorySection, FeaturedProducts, TestimonialsSection, FAQSection) — port from old components, upgrade to shadcn/ui, remove daisyui classes, remove react-router-dom imports, replace react-scroll with Next.js scroll utilities.

- [ ] 6. Verify all pages render:
```bash
pnpm dev
# Navigate to localhost:3000, /products, /products/netflix
# Verify no daisyui classes, no react-router-dom imports
```

- [ ] Commit: `git add -A && git commit -m "feat: storefront pages — homepage, products listing, product detail with variant selector"`

---

## Task 10: Cart & Checkout Flow

**Files:**
- `app/(store)/cart/page.tsx`
- `app/(store)/checkout/page.tsx`
- `components/store/QuantityStepper.tsx`
- `components/store/OrderSummary.tsx`
- `components/store/CheckoutStep1.tsx`
- `components/store/CheckoutStep2.tsx`
- `components/store/CheckoutStep3.tsx`

**Interfaces:**
- Consumes: Task 3 (types, validators), Task 5 (orders API, payments API), Task 8 (cart context — getSubtotal, getTotal, NOT total)
- Produces: Full cart management and 3-step checkout flow

**Steps:**

- [ ] 1. Create `app/(store)/cart/page.tsx` — use getSubtotal() (FIX old total bug):
```tsx
"use client"

import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import Link from "next/link"
import QuantityStepper from "@/components/store/QuantityStepper"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTax, getTotal, getItemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Keranjang Kosong</h1>
        <p className="text-muted-foreground mb-6">Belum ada item di keranjang.</p>
        <Link href="/products">
          <Button>Mulai Belanja</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Keranjang ({getItemCount()} item)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variantId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground">{item.variantName} • {item.duration}</p>
                  <p className="text-primary font-bold">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <QuantityStepper
                    quantity={item.quantity}
                    onChange={(q) => updateQuantity(item.variantId, q)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.variantId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pajak (11% PPN)</span>
              <span>{formatPrice(getTax())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(getTotal())}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-4">Checkout</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] 2. Create 3-step checkout `app/(store)/checkout/page.tsx`:
```tsx
"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import CheckoutStep1 from "@/components/store/CheckoutStep1"
import CheckoutStep2 from "@/components/store/CheckoutStep2"
import CheckoutStep3 from "@/components/store/CheckoutStep3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StepIndicator } from "@/components/store/StepIndicator"
import type { CheckoutFormData } from "@/types"

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CheckoutFormData | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const { items, getSubtotal, getTax, getTotal } = useCart()
  const router = useRouter()

  async function handleStep1Submit(data: CheckoutFormData) {
    setFormData(data)
    setStep(2)
  }

  async function handleStep2Submit() {
    if (!formData) return

    // Step 1: Create order
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      }),
    })
    const orderData = await orderRes.json()
    if (!orderData.success) return alert("Gagal membuat pesanan")

    // Step 2: Create payment
    const payRes = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: orderData.data.orderId,
        paymentMethod: formData.paymentMethod,
        bankCode: formData.bankCode,
      }),
    })
    const payData = await payRes.json()
    if (!payData.success) return alert("Gagal membuat pembayaran")

    setOrderId(orderData.data.orderId)
    setPaymentUrl(payData.data.paymentUrl)
    setStep(3)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      <StepIndicator currentStep={step} />

      <Card className="mt-8">
        <CardContent className="p-6">
          {step === 1 && <CheckoutStep1 onSubmit={handleStep1Submit} />}
          {step === 2 && (
            <CheckoutStep2
              formData={formData!}
              onSubmit={handleStep2Submit}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && orderId && (
            <CheckoutStep3
              orderId={orderId}
              paymentUrl={paymentUrl}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] 3. Create `CheckoutStep3.tsx` with auto-poll:
```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface CheckoutStep3Props {
  orderId: string
  paymentUrl: string | null
}

export default function CheckoutStep3({ orderId, paymentUrl }: CheckoutStep3Props) {
  const [status, setStatus] = useState("AWAITING_PAYMENT")
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (data.data?.status === "FULFILLED" || data.data?.status === "FAILED") {
        setStatus(data.data.status)
        clearInterval(interval)
        router.refresh()
      }
    }, 10000) // poll every 10s

    return () => clearInterval(interval)
  }, [orderId, router])

  return (
    <div className="text-center space-y-6">
      <h2 className="text-xl font-bold">Menunggu Pembayaran</h2>
      <p className="text-muted-foreground">
        Silakan selesaikan pembayaran Anda.
      </p>

      {paymentUrl && (
        <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Bayar Sekarang
          </Button>
        </a>
      )}

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Status: {status}</p>
        <Link href={`/orders/${orderId}`}>
          <Button variant="link">Lacak Pesanan</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] 4. Verify checkout flow:
```bash
pnpm dev
# Add items to cart → /cart → /checkout → step 1 → step 2 → step 3
# Verify poll works, payment URL opens
```

- [ ] Commit: `git add -A && git commit -m "feat: cart page and 3-step checkout flow with payment polling"`

---

## Task 11: Order Status Page

**Files:**
- `app/(store)/orders/[id]/page.tsx`
- `components/store/OrderTimeline.tsx`
- `components/store/CredentialsCard.tsx`

**Interfaces:**
- Consumes: Task 3 (types), Task 5 (orders API GET), Task 8 (layouts)
- Produces: Customer-facing order tracking page with timeline and credential display

**Steps:**

- [ ] 1. Create `app/(store)/orders/[id]/page.tsx` with auto-refresh:
```tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import OrderTimeline from "@/components/store/OrderTimeline"
import CredentialsCard from "@/components/store/CredentialsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import type { OrderWithItems } from "@/types"

const TERMINAL_STATUSES = ["FULFILLED", "FAILED"]

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let intervalId: NodeJS.Timeout

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`)
        const data = await res.json()
        if (data.success) setOrder(data.data)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    // Auto-refresh every 10s, stop after 30 minutes or terminal status
    const startTime = Date.now()
    intervalId = setInterval(() => {
      if (Date.now() - startTime > 30 * 60 * 1000) {
        clearInterval(intervalId)
        return
      }
      fetchOrder().then(() => {
        // will be checked in the next interval
      })
    }, 10000)

    // Also stop when status is terminal
    const checkTerminal = setInterval(() => {
      if (order && TERMINAL_STATUSES.includes(order.status)) {
        clearInterval(intervalId)
        clearInterval(checkTerminal)
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
      clearInterval(checkTerminal)
      clearTimeout(timeoutId)
    }
  }, [id])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-8">Pesanan tidak ditemukan</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Status Pesanan</h1>
      <p className="text-muted-foreground mb-8">Order #{order.orderNumber}</p>

      <OrderTimeline status={order.status} />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Detail Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.variant.product.name} - {item.variant.name} x{item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      {order.status === "FULFILLED" && order.stocks.length > 0 && (
        <CredentialsCard stocks={order.stocks} />
      )}
    </div>
  )
}
```

- [ ] 2. Create `components/store/CredentialsCard.tsx` — blurred by default, reveal on click:
```tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Copy, Check } from "lucide-react"

interface CredentialsCardProps {
  stocks: Array<{ id: string; credentials: string; variantId: string }>
}

export default function CredentialsCard({ stocks }: CredentialsCardProps) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>📦 Akun Anda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stocks.map((stock) => (
          <div key={stock.id} className="flex items-center gap-2">
            <div
              className={`flex-1 font-mono text-sm bg-muted p-3 rounded transition-all ${
                revealed[stock.id] ? "" : "blur-sm select-none"
              }`}
            >
              {stock.credentials}
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleReveal(stock.id)}>
              {revealed[stock.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(stock.credentials, stock.id)}
            >
              {copied === stock.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] 3. Verify order status page:
```bash
pnpm dev
# Place an order → navigate to /orders/{orderId}
# Verify timeline shows, poll works, credentials blur/reveal
```

- [ ] Commit: `git add -A && git commit -m "feat: order status page with timeline, auto-refresh, and credential reveal"`

---

## Task 12: Admin Dashboard

**Files:**
- `app/(admin)/dashboard/page.tsx`
- `app/(admin)/products/page.tsx`
- `app/(admin)/products/new/page.tsx`
- `app/(admin)/products/[id]/page.tsx`
- `app/(admin)/orders/page.tsx`
- `app/(admin)/orders/[id]/page.tsx`
- `app/(admin)/stock/page.tsx`
- `app/(admin)/stock/[variantId]/page.tsx`
- `components/admin/AdminSidebar.tsx`
- `components/admin/ProductForm.tsx`
- `components/admin/StatsCard.tsx`
- `components/admin/DataTable.tsx`

**Interfaces:**
- Consumes: Task 4 (admin auth), Task 5 (admin API routes), Task 8 (admin layout, sidebar)
- Produces: Complete admin dashboard — stats, CRUD products, manage stock, view/fulfill orders

**Steps:**

- [ ] 1. Create `components/admin/AdminSidebar.tsx`:
```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingCart, Warehouse, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/admin/stock", label: "Stok", icon: Warehouse },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/admin/login"
  }

  return (
    <aside className="w-64 border-r bg-card h-screen sticky top-0 p-4 flex flex-col">
      <h2 className="font-bold text-lg mb-6">Bubblepi Admin</h2>
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive ? "bg-primary text-white" : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted text-destructive">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  )
}
```

- [ ] 2. Create `app/(admin)/dashboard/page.tsx` — bento grid stats:
```tsx
import { db } from "@/lib/db"
import StatsCard from "@/components/admin/StatsCard"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminDashboard() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [revenueToday, totalOrders, pendingOrders, criticalStock, recentOrders] = await Promise.all([
    db.order.aggregate({
      where: { status: "FULFILLED", paidAt: { gte: today } },
      _sum: { total: true },
    }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PAID"] } } }),
    db.variant.findMany({
      include: { stock: { where: { status: "AVAILABLE" } } },
    }).then((variants) => variants.filter((v) => v.stock.length < 5).length),
    db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Revenue Hari Ini" value={formatPrice(revenueToday._sum.total ?? 0)} />
        <StatsCard title="Total Pesanan" value={totalOrders.toString()} />
        <StatsCard title="Pesanan Pending" value={pendingOrders.toString()} />
        <StatsCard title="Stok Kritis" value={criticalStock.toString()} variant="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <div>
                  <span className="font-mono text-sm">{order.orderNumber}</span>
                  <span className="ml-2 text-muted-foreground">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "FULFILLED" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                  <span className="text-sm">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] 3. Create products management pages:
```bash
# app/(admin)/products/page.tsx — table with edit/delete
# app/(admin)/products/new/page.tsx — ProductForm (create mode)
# app/(admin)/products/[id]/page.tsx — ProductForm (edit mode)
```

- [ ] 4. Create orders management pages:
```bash
# app/(admin)/orders/page.tsx — table with status filter dropdown
# app/(admin)/orders/[id]/page.tsx — order detail + manual fulfill button
```

- [ ] 5. Create stock management pages:
```bash
# app/(admin)/stock/page.tsx — overview per variant (available/assigned/delivered counts)
# app/(admin)/stock/[variantId]/page.tsx — add/view/delete stock items for a variant
```

- [ ] 6. Verify admin dashboard:
```bash
pnpm dev
# Login → /admin/dashboard → check stats, navigate to products/orders/stock
```

- [ ] Commit: `git add -A && git commit -m "feat: admin dashboard — stats, products, orders, stock management"`

---

## Task 13: Cleanup & Migration

**Files:**
- Remove: `vite.config.js`, `src/`, `index.html`, `package-lock.json`, `src.old/`, `public.old/`, `package.json.old`
- Update: `README.md`

**Interfaces:**
- Consumes: All previous tasks (complete Next.js app exists)
- Produces: Clean repo with only Next.js code, updated README

**Steps:**

- [ ] 1. Remove old Vite project files:
```bash
cd ~/projects/Bubblepi-Store
rm -rf src.old public.old package.json.old
rm -f vite.config.js index.html package-lock.json tailwind.config.js postcss.config.js
```

- [ ] 2. Update `README.md`:
```markdown
# Bubblepi Store

Premium digital accounts marketplace built with Next.js 15.

## Tech Stack
- Next.js 15 (App Router, TypeScript strict)
- shadcn/ui + Tailwind CSS 3
- Prisma + PostgreSQL
- Xendit (QRIS + Virtual Account)
- Resend + React Email

## Setup
1. Install pnpm: `npm install -g pnpm`
2. Install deps: `pnpm install`
3. Setup env: `cp .env.example .env.local` (fill in values)
4. Setup DB: `pnpm prisma migrate dev`
5. Seed: `pnpm prisma db seed`
6. Dev: `pnpm dev`

## Deployment
- Vercel: connect repo, set env vars, add `prisma migrate deploy` to build
- PostgreSQL: use Vercel Postgres, Neon, or Supabase
```

- [ ] 3. Final validation checks:
```bash
# No USD prices
grep -r '\$' app/ --include="*.tsx" --include="*.ts" | grep -v 'className' | grep -v '//' | grep -v 'http'

# No mock data in components (should only be in seed)
grep -r 'mock\|dummy\|fake\|placeholder' components/ --include="*.tsx"

# No `any` TypeScript
grep -rn ': any\|as any' app/ lib/ components/ --include="*.ts" --include="*.tsx"

# No daisyui classes
grep -r 'btn-\|badge-\|alert-\|card-\|drawer-\|modal-' components/ --include="*.tsx"

# No react-router-dom
grep -r 'react-router-dom' . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
```

- [ ] 4. Clean node_modules and reinstall:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

- [ ] Commit: `git add -A && git commit -m "chore: cleanup old Vite files, update README, final validation"`

---

## Task 14: Deploy to Vercel

**Files:**
- `.env.local` (set real values on Vercel dashboard)
- `vercel.json` (if needed for Prisma postinstall)
- `package.json` (add postinstall script for Prisma)

**Interfaces:**
- Consumes: All previous tasks (complete, tested app)
- Produces: Live deployment on Vercel

**Steps:**

- [ ] 1. Add Prisma postinstall to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] 2. Push to GitHub:
```bash
cd ~/projects/Bubblepi-Store
git add -A
git commit -m "chore: ready for Vercel deployment"
git push origin main
```

- [ ] 3. Connect Vercel project:
```bash
# Via Vercel CLI or dashboard:
# 1. Import repo holycann/Bubblepi-Store
# 2. Framework: Next.js
# 3. Build command: pnpm build
# 4. Install command: pnpm install
```

- [ ] 4. Set Vercel environment variables:
```
DATABASE_URL=postgresql://...           # Vercel Postgres / Neon / Supabase
XENDIT_SECRET_KEY=xnd_...               # Xendit sandbox
XENDIT_WEBHOOK_TOKEN=...                # Webhook validation token
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_pub...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@bubblepi.store
ADMIN_PASSWORD=your-admin-password
ADMIN_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_URL=https://bubblepi-store.vercel.app
```

- [ ] 5. Configure Vercel build settings for Prisma:
```json
// vercel.json (if needed)
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "pnpm install"
}
```

- [ ] 6. Test deployment:
```bash
# After Vercel deploy completes:
# 1. Visit https://bubblepi-store.vercel.app
# 2. Browse products → add to cart → checkout
# 3. Create Xendit invoice → verify redirect
# 4. Check /admin/login → dashboard
# 5. Verify email delivery (order confirmation)
# 6. Simulate webhook → verify fulfillment
```

- [ ] Commit: `git add -A && git commit -m "chore: Vercel deployment config"`

---

## Notes

### Key Bugs Fixed from Old Codebase
1. **Cart total bug:** Old `CheckoutPage` used `total` (undefined) → now uses `getSubtotal()` from context
2. **Cart item identity:** Old code keyed by `productId` → now keyed by `variantId`
3. **Lenis duplicate:** Old code init Lenis in multiple places → now single instance in root layout only
4. **Currency:** Old code used USD ($) → now all IDR with `formatPrice()`
5. **WhatsApp checkout:** Removed — email only per PRD
6. **Order ID randomness:** Old `Math.random()` → now `crypto.randomBytes()` with `generateOrderId()`

### Webhook Flow
```
Xendit → POST /api/payments/webhook
  → Validate x-callback-token
  → If PAID: fulfillOrder(orderId)
    → Per item per quantity: findFirst AVAILABLE stock → assign
    → If no stock: status = PENDING_STOCK
    → If all assigned: status = FULFILLED → send email
  → If EXPIRED: status = FAILED
```

### Admin Auth
- Single password, httpOnly JWT cookie (8h expiry)
- Protected via `middleware.ts`
- No user roles — single admin only

### MVP Shortcuts (ponytail: upgrade later)
- Credentials stored plaintext (ponytail: AES-256 encryption post-MVP)
- No rate limiting on API routes (ponytail: add rate limiting post-MVP)
- No email verification on customer email (ponytail: add verification post-MVP)
