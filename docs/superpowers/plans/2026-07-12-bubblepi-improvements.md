# Bubblepi Store — Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical bugs, add missing features, and improve UX for both buyers and admin of Bubblepi Store — a digital account marketplace.

**Architecture:** Next.js 15 App Router + TypeScript + Prisma 6 + PostgreSQL (Neon) + Xendit payments + Resend email + Tailwind CSS + shadcn/ui

**Tech Stack:** Next.js 15, TypeScript strict, Prisma 6, PostgreSQL (Neon), Xendit SDK, Resend, shadcn/ui, Tailwind CSS 4, pnpm, Sonner (toast)

## Global Constraints
- Working directory: `~/projects/Bubblepi-Store` (main branch, live on Vercel)
- Worktree for builds: `~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration`
- Always use `npx next build` (not pnpm build) due to ERR_PNPM_IGNORED_BUILDS
- Always sync files from worktree to root repo before committing
- `export const dynamic = "force-dynamic"` required on all DB-querying server pages
- shadcn components are manually created (no CLI — it times out)
- Prisma: use `node_modules/.bin/prisma`, not `pnpm prisma`
- After schema changes: `npx prisma migrate dev --name <name>` locally, then `npx prisma migrate deploy` on Neon
- Build verify command: `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build`
- Commit and push to `origin main` after each task

---

## Phase 1: Critical Bug Fixes

### Task 1: Fix webhook token validation bug

**Problem:** `app/api/payments/webhook/route.ts` line 8: `if (token !== process.env.XENDIT_WEBHOOK_TOKEN)` blocks ALL webhooks when env var is not set. Auto-fulfill never runs.

**Files:**
- Modify: `app/api/payments/webhook/route.ts`

**Interfaces:**
- Consumes: Xendit callback token from request header
- Produces: Webhook processing (order update + auto-fulfill)

- [ ] **Step 1: Read current webhook route**

```bash
cat ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/api/payments/webhook/route.ts
```

- [ ] **Step 2: Fix token validation**

Replace lines 7-9:

```typescript
// BEFORE (broken):
const token = request.headers.get("x-callback-token")
if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
  return NextResponse.json({ error: "Invalid token" }, { status: 401 })
}

// AFTER (fixed):
const token = request.headers.get("x-callback-token")
const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
if (webhookToken && token !== webhookToken) {
  return NextResponse.json({ error: "Invalid token" }, { status: 401 })
}
```

- [ ] **Step 3: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 4: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/api/payments/webhook/route.ts ~/projects/Bubblepi-Store/app/api/payments/webhook/route.ts
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "fix: webhook token validation — only block if env var set" && git push origin main
```

---

### Task 2: Fix productSchema image validation

**Problem:** `lib/validators.ts` has `image: z.string().url()` but products use local paths like `/products/netflix.svg`. Admin create/edit product forms always fail validation.

**Files:**
- Modify: `lib/validators.ts`

**Interfaces:**
- Consumes: product form data from admin pages
- Produces: validated product data for API

- [ ] **Step 1: Fix image validation**

In `lib/validators.ts`, change:

```typescript
// BEFORE:
image: z.string().url(),

// AFTER:
image: z.string().min(1, "URL gambar tidak boleh kosong"),
```

- [ ] **Step 2: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 3: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/lib/validators.ts ~/projects/Bubblepi-Store/lib/validators.ts
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "fix: product image validation — accept local paths" && git push origin main
```

---

### Task 3: Fix double-submit on checkout + replace alert() with toast

**Problem:** `app/(store)/checkout/page.tsx` — `handleStep2Submit` has no loading state (double-click = 2 orders). Errors use `alert()` which is ugly and sometimes blocked.

**Files:**
- Modify: `app/(store)/checkout/page.tsx`
- Create: `components/ui/sonner.tsx` (if missing)
- Modify: `app/layout.tsx` (add Toaster)

**Interfaces:**
- Consumes: CartContext (items, clearCart), CheckoutFormData
- Produces: Order creation + payment URL

- [ ] **Step 1: Install sonner**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && pnpm add sonner
```

- [ ] **Step 2: Create Sonner component**

Create `components/ui/sonner.tsx`:

```tsx
"use client"

import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

- [ ] **Step 3: Add Toaster to layout.tsx**

In `app/layout.tsx`, add import and component:

```tsx
import { Toaster } from "sonner"

// Inside the <body> tag, add:
<Toaster richColors position="top-center" />
```

- [ ] **Step 4: Rewrite checkout page with loading state + toast**

Replace `app/(store)/checkout/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import CheckoutStep1 from "@/components/store/CheckoutStep1"
import CheckoutStep2 from "@/components/store/CheckoutStep2"
import CheckoutStep3 from "@/components/store/CheckoutStep3"
import StepIndicator from "@/components/store/StepIndicator"
import { Card, CardContent } from "@/components/ui/card"
import type { CheckoutFormData } from "@/types"

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CheckoutFormData | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { items, clearCart } = useCart()
  const router = useRouter()

  if (items.length === 0 && step < 3) {
    router.push("/cart")
    return null
  }

  async function handleStep1Submit(data: CheckoutFormData) {
    setFormData(data)
    setStep(2)
  }

  async function handleStep2Submit() {
    if (!formData || submitting) return
    setSubmitting(true)

    try {
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
      if (!orderData.success) throw new Error(orderData.error ?? "Gagal membuat pesanan")

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
      if (!payData.success) throw new Error(payData.error ?? "Gagal membuat pembayaran")

      setOrderId(orderData.data.orderId)
      setPaymentUrl(payData.data.paymentUrl)
      clearCart()
      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
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
              submitting={submitting}
            />
          )}
          {step === 3 && orderId && (
            <CheckoutStep3 orderId={orderId} paymentUrl={paymentUrl} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Update CheckoutStep2 to accept submitting prop**

In `components/store/CheckoutStep2.tsx`, update Props interface and disable button:

```tsx
interface Props {
  formData: CheckoutFormData
  onSubmit: () => void
  onBack: () => void
  submitting?: boolean
}

// In the Button at bottom:
<Button onClick={onSubmit} disabled={submitting} className="w-full gap-2">
  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
  {submitting ? "Memproses..." : "Bayar Sekarang"}
</Button>
```

- [ ] **Step 6: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 7: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/ui/sonner.tsx ~/projects/Bubblepi-Store/components/ui/sonner.tsx 2>/dev/null
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/layout.tsx ~/projects/Bubblepi-Store/app/layout.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/checkout/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/checkout/page.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/store/CheckoutStep2.tsx ~/projects/Bubblepi-Store/components/store/CheckoutStep2.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/package.json ~/projects/Bubblepi-Store/package.json
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/pnpm-lock.yaml ~/projects/Bubblepi-Store/pnpm-lock.yaml
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "fix: checkout double-submit protection + toast errors" && git push origin main
```

---

### Task 4: Fix paidAt being overwritten + stock DELIVERED status

**Problem:** `lib/order.ts` sets `paidAt: new Date()` during fulfill, overwriting the real paidAt from webhook. Also stock status stuck at ASSIGNED forever (never DELIVERED).

**Files:**
- Modify: `lib/order.ts`

**Interfaces:**
- Consumes: Order with items, variants, products
- Produces: Updated order status + email delivery

- [ ] **Step 1: Fix paidAt overwrite**

In `lib/order.ts`, in the fulfill block (around line 67-78), replace:

```typescript
// BEFORE:
if (allAssigned) {
    await db.order.update({
      where: { id: orderId },
      data: { status: "FULFILLED", paidAt: new Date() },
    })
    await sendAccountDelivery({ ... })
  }

// AFTER:
if (allAssigned) {
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "FULFILLED",
        ...(order.paidAt ? {} : { paidAt: new Date() }),
      },
    })
    // Update stock status from ASSIGNED to DELIVERED
    await db.accountStock.updateMany({
      where: { orderId: orderId, status: "ASSIGNED" },
      data: { status: "DELIVERED" },
    })
    await sendAccountDelivery({ ... })
  }
```

- [ ] **Step 2: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 3: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/lib/order.ts ~/projects/Bubblepi-Store/lib/order.ts
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "fix: paidAt overwrite + stock ASSIGNED→DELIVERED after fulfill" && git push origin main
```

---

## Phase 2: Core Features

### Task 5: Persist cart to localStorage

**Problem:** Cart in React useState — refreshing empties cart. Buyer loses items.

**Files:**
- Modify: `context/CartContext.tsx`

**Interfaces:**
- Produces: CartContext with getItemCount, addItem, removeItem, updateQuantity, clearCart

- [ ] **Step 1: Rewrite CartContext with localStorage sync**

```tsx
"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { CartItem, ProductVariant } from "@/types"

interface CartContextType {
  items: CartItem[]
  addItem: (variant: ProductVariant & { productName: string }, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const CART_KEY = "bubblepi_cart"

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(CART_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadCart())
    setMounted(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    }
  }, [items, mounted])

  const addItem = useCallback((variant: ProductVariant & { productName: string }, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id)
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: variant.productName,
          name: variant.name,
          duration: variant.duration,
          price: variant.price,
          quantity,
        },
      ]
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId))
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.variantId !== variantId))
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const getItemCount = useCallback(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const getTotal = useCallback(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, getItemCount, getTotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}
```

- [ ] **Step 2: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 3: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/context/CartContext.tsx ~/projects/Bubblepi-Store/context/CartContext.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: persist cart to localStorage" && git push origin main
```

---

### Task 6: Add Telegram notification to admin

**Problem:** Admin solo has no notifications. Must manually check dashboard for new orders.

**Files:**
- Create: `lib/telegram.ts`
- Modify: `app/api/orders/route.ts` (new order notification)
- Modify: `lib/order.ts` (PENDING_STOCK + FULFILLED notification)

**Env vars needed:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

**Interfaces:**
- Produces: `sendTelegramNotification(message: string): Promise<void>`

- [ ] **Step 1: Create telegram.ts**

```typescript
export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return // silent if not configured
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    })
  } catch (e) {
    console.error("Telegram notification failed:", e)
  }
}
```

- [ ] **Step 2: Add notification in order creation**

In `app/api/orders/route.ts`, after `db.order.create()`, add:

```typescript
import { sendTelegramNotification } from "@/lib/telegram"

// After order creation:
sendTelegramNotification(
  `🛒 <b>Pesanan Baru!</b>\n` +
  `#${order.orderNumber}\n` +
  `Pelanggan: ${customerName}\n` +
  `Total: Rp ${total.toLocaleString("id-ID")}\n` +
  `Item: ${orderItems.map((i) => i.variantId).length} produk`
)
```

- [ ] **Step 3: Add notification in lib/order.ts**

In `lib/order.ts`, import telegram and add:

```typescript
import { sendTelegramNotification } from "@/lib/telegram"

// In the PENDING_STOCK block (allAssigned = false):
sendTelegramNotification(
  `⚠️ <b>Stok Kosong!</b>\nOrder #${order.orderNumber}\nMenunggu stok untuk fulfillment.`
)

// In the FULFILLED block:
sendTelegramNotification(
  `✅ <b>Order Fulfilled!</b>\n#${order.orderNumber}\nAkun dikirim ke ${order.customerEmail}`
)
```

- [ ] **Step 4: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 5: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/lib/telegram.ts ~/projects/Bubblepi-Store/lib/telegram.ts
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/api/orders/route.ts ~/projects/Bubblepi-Store/app/api/orders/route.ts
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/lib/order.ts ~/projects/Bubblepi-Store/lib/order.ts
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: Telegram admin notifications for new orders, PENDING_STOCK, fulfilled" && git push origin main
```

---

### Task 7: Add product type (sharing/private) and warranty to schema

**Problem:** Core business distinction (sharing vs private) and warranty info not in database. Can't filter, display, or manage them.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/validators.ts` (update productSchema, variantSchema)
- Modify: `app/admin/products/new/page.tsx` (add type selector)
- Modify: `app/admin/products/[id]/page.tsx` (add type + warranty fields)
- Modify: `app/(store)/products/[slug]/page.tsx` (display type + warranty badges)

**Interfaces:**
- Produces: Product with `type` field, Variant with `hasWarranty` + `warrantyDays`

- [ ] **Step 1: Update Prisma schema**

In `prisma/schema.prisma`, add fields:

```prisma
model Product {
  # existing fields...
  type        String    @default("sharing") # "sharing" | "private"
}

model Variant {
  # existing fields...
  hasWarranty    Boolean  @default(false)
  warrantyDays   Int?
}
```

- [ ] **Step 2: Run migration**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && node_modules/.bin/prisma migrate dev --name add-product-type-warranty
```

- [ ] **Step 3: Push migration to Neon**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && node_modules/.bin/prisma migrate deploy
```

- [ ] **Step 4: Update validators**

In `lib/validators.ts`:

```typescript
export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  image: z.string().min(1, "URL gambar tidak boleh kosong"),
  category: z.string().min(1),
  type: z.enum(["sharing", "private"]).default("sharing"),
  isActive: z.boolean(),
})

export const variantSchema = z.object({
  productId: z.string().cuid(),
  name: z.string().min(1),
  duration: z.string().min(1),
  price: z.number().int().positive(),
  hasWarranty: z.boolean().default(false),
  warrantyDays: z.number().int().positive().nullable().optional(),
})
```

- [ ] **Step 5: Update admin new product form**

In `app/admin/products/new/page.tsx`, add type selector in product form:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-1.5">
    <Label>Tipe Akun</Label>
    <select
      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
      value={form.type}
      onChange={(e) => setForm({ ...form, type: e.target.value })}
    >
      <option value="sharing">Sharing</option>
      <option value="private">Private</option>
    </select>
  </div>
  <div className="space-y-1.5">
    <Label>Kategori</Label>
    <Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="streaming" />
  </div>
</div>
```

Also update form state to include `type: "sharing"`.

- [ ] **Step 6: Update admin edit product form**

In `app/admin/products/[id]/page.tsx`, add same type selector and update variant form to include warranty fields.

- [ ] **Step 7: Show type + warranty on product detail**

In `app/(store)/products/[slug]/page.tsx`, add badges:

```tsx
{/* After product name */}
<div className="flex items-center gap-2 mt-2">
  <Badge variant="outline">{product.type === "sharing" ? "🔗 Sharing" : "🔑 Private"}</Badge>
</div>

{/* On each variant */}
<div className="flex items-center gap-2 mt-1">
  <Badge variant="outline" className="text-xs">{v.name}</Badge>
  {v.hasWarranty && (
    <Badge variant="default" className="text-xs">🛡️ Garansi {v.warrantyDays} hari</Badge>
  )}
  <Badge variant={stockCount > 0 ? "secondary" : "destructive"} className="text-xs">
    {stockCount > 0 ? `Sisa ${stockCount}` : "Habis"}
  </Badge>
</div>
```

- [ ] **Step 8: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 9: Sync + commit + push**

```bash
# Sync all modified files
for f in prisma/schema.prisma lib/validators.ts prisma/migrations/* lib/seed.ts; do
  cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/$f ~/projects/Bubblepi-Store/$f 2>/dev/null
done
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/admin/products/new/page.tsx ~/projects/Bubblepi-Store/app/admin/products/new/page.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/admin/products/\[id\]/page.tsx ~/projects/Bubblepi-Store/app/admin/products/\[id\]/page.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/products/\[slug\]/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/products/\[slug\]/page.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: product type (sharing/private) + warranty fields in schema + UI" && git push origin main
```

---

### Task 8: Add stock count per variant on product pages

**Problem:** Buyers can't see stock left. No urgency, no transparency.

**Files:**
- Modify: `app/(store)/products/[slug]/page.tsx`
- Modify: `app/(store)/products/page.tsx`
- Modify: `components/store/ProductCard.tsx`

**Interfaces:**
- Consumes: variant.stockCount from DB query
- Produces: "Sisa X" badge, "Habis" state on AddToCartButton

- [ ] **Step 1: Add stock count query in product detail**

In `app/(store)/products/[slug]/page.tsx`, after fetching product:

```typescript
const variantsWithStock = await Promise.all(
  product.variants.map(async (v) => ({
    ...v,
    stockCount: await db.accountStock.count({
      where: { variantId: v.id, status: "AVAILABLE" },
    }),
  }))
)
```

Pass `variantsWithStock` to the variant map instead of `product.variants`.

- [ ] **Step 2: Add stock badge on each variant**

```tsx
{variantsWithStock.map((variant) => (
  <div key={variant.id}>
    <AddToCartButton variant={variant} product={product} stockCount={variant.stockCount} />
    {variant.stockCount > 0 && variant.stockCount <= 5 && (
      <p className="text-xs text-destructive mt-1 text-center">Sisa {variant.stockCount}</p>
    )}
  </div>
))}
```

- [ ] **Step 3: Update AddToCartButton to disable on 0 stock**

In `components/store/AddToCartButton.tsx`, add:

```tsx
interface Props {
  variant: ProductVariant
  product: { id: string; name: string }
  stockCount?: number
}

// In component:
const isOutOfStock = stockCount === 0

// Button:
<Button
  onClick={handleAdd}
  disabled={isOutOfStock}
  className="w-full"
>
  {isOutOfStock ? "Habis" : `Tambah ke Keranjang`}
</Button>
```

- [ ] **Step 4: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 5: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/products/\[slug\]/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/products/\[slug\]/page.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/store/ProductCard.tsx ~/projects/Bubblepi-Store/components/store/ProductCard.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/store/AddToCartButton.tsx ~/projects/Bubblepi-Store/components/store/AddToCartButton.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: stock count per variant — 'Sisa X' badge + disable on 0" && git push origin main
```

---

### Task 9: Add "Cara Kerja" section to homepage

**Problem:** New buyers (all kalangan) don't understand the process. No onboarding visual.

**Files:**
- Create: `components/store/HowItWorks.tsx`
- Modify: `app/(store)/page.tsx`

**Interfaces:**
- Consumes: None
- Produces: HowItWorks component

- [ ] **Step 1: Create HowItWorks component**

```tsx
import { ShoppingBag, CreditCard, Mail, CheckCircle2 } from "lucide-react"

const steps = [
  { icon: ShoppingBag, number: "1", title: "Pilih Produk", desc: "Pilih produk dan varian yang kamu mau." },
  { icon: CreditCard, number: "2", title: "Bayar", desc: "Bayar via QRIS atau Virtual Account." },
  { icon: Mail, number: "3", title: "Terima Akun", desc: "Akun dikirim langsung ke email kamu." },
]

export default function HowItWorks() {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Cara Kerjanya</h2>
        <p className="text-muted-foreground mt-2">Beli akun digital dalam 3 langkah mudah</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 relative">
                <Icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm max-w-[200px]">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t border-dashed border-muted-foreground/20" />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add to homepage**

In `app/(store)/page.tsx`, import and add:

```tsx
import HowItWorks from "@/components/store/HowItWorks"

// Between FeaturedProducts and TestimonialsSection:
<HowItWorks />
```

- [ ] **Step 3: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 4: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/store/HowItWorks.tsx ~/projects/Bubblepi-Store/components/store/HowItWorks.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/page.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: 'Cara Kerja' 3-step onboarding section on homepage" && git push origin main
```

---

## Phase 3: Buyer UX Improvements

### Task 10: Add order lookup by email

**Problem:** Buyers forget order ID, can't access credentials again. No "track my order" flow.

**Files:**
- Create: `app/(store)/orders/page.tsx`
- Create: `app/api/orders/lookup/route.ts`
- Modify: `components/store/Navbar.tsx` (add "Lacak Pesanan" link)

**Interfaces:**
- Produces: Order lookup page + API endpoint

- [ ] **Step 1: Create lookup API**

```typescript
// app/api/orders/lookup/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })
  }

  const orders = await db.order.findMany({
    where: { customerEmail: email },
    include: { items: { include: { variant: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Don't return credentials in lookup — only order info
  const safeOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      variantName: i.variant.name,
      quantity: i.quantity,
      price: i.price,
    })),
  }))

  return NextResponse.json({ success: true, data: safeOrders })
}
```

- [ ] **Step 2: Create orders lookup page**

```tsx
// app/(store)/orders/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  FULFILLED: "Selesai", FAILED: "Gagal", PENDING_STOCK: "Menunggu Stok",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FULFILLED: "default", PAID: "secondary", PENDING: "outline",
  AWAITING_PAYMENT: "outline", FAILED: "destructive", PENDING_STOCK: "destructive",
}

export default function OrderLookupPage() {
  const [email, setEmail] = useState("")
  const [orders, setOrders] = useState<Array<Record<string, any>>>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/orders/lookup?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Lacak Pesanan</h1>
      <p className="text-muted-foreground text-center mb-8">Masukkan email yang digunakan saat checkout</p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="email@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="gap-2">
          <Search className="h-4 w-4" />
          {loading ? "Mencari..." : "Cari"}
        </Button>
      </form>

      {searched && orders.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Tidak ada pesanan ditemukan untuk email ini.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
                <span className="text-sm font-bold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add "Lacak Pesanan" link in Navbar**

In `components/store/Navbar.tsx`, add to navLinks:

```tsx
const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Produk" },
  { href: "/orders", label: "Lacak Pesanan" },
]
```

- [ ] **Step 4: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 5: Sync + commit + push**

```bash
mkdir -p ~/projects/Bubblepi-Store/app/\(store\)/orders
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/orders/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/orders/page.tsx
mkdir -p ~/projects/Bubblepi-Store/app/api/orders/lookup
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/api/orders/lookup/route.ts ~/projects/Bubblepi-Store/app/api/orders/lookup/route.ts
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/store/Navbar.tsx ~/projects/Bubblepi-Store/components/store/Navbar.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: order lookup by email + 'Lacak Pesanan' in Navbar" && git push origin main
```

---

## Phase 4: Admin UX Improvements

### Task 11: Add pagination + search to admin orders

**Problem:** Admin orders page loads ALL orders. Will crash on 100+ orders. No search.

**Files:**
- Modify: `app/admin/orders/page.tsx`

**Interfaces:**
- Consumes: searchParams (page, search, status)
- Produces: Paginated, searchable order list

- [ ] **Step 1: Rewrite admin orders with pagination + search**

```tsx
import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  FULFILLED: "Selesai", FAILED: "Gagal", PENDING_STOCK: "Menunggu Stok",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FULFILLED: "default", PAID: "secondary", PENDING: "outline",
  AWAITING_PAYMENT: "outline", FAILED: "destructive", PENDING_STOCK: "destructive",
}
const STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED", "FAILED", "PENDING_STOCK"]

interface Props { searchParams: Promise<{ status?: string; page?: string; search?: string }> }

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, page: pageStr, search } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    db.order.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pesanan</h1>
        <p className="text-muted-foreground mt-1">{total} pesanan ditemukan</p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <Input
          name="search"
          placeholder="Cari order#, nama, atau email..."
          defaultValue={search ?? ""}
          className="max-w-sm"
        />
        <Button type="submit">Cari</Button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/orders">
          <Badge variant={!status ? "default" : "outline"} className="cursor-pointer px-3 py-1 text-sm">
            Semua
          </Badge>
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}${search ? `&search=${search}` : ""}`}>
            <Badge variant={status === s ? "default" : "outline"} className="cursor-pointer px-3 py-1 text-sm">
              {STATUS_LABEL[s]}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Tidak ada pesanan</p>
          </div>
        ) : orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{order.customerName} • {order.customerEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={STATUS_VARIANT[order.status] ?? "outline"} className="text-xs">
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
              <span className="text-sm font-bold">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}>
            <Button variant="outline" size="sm" disabled={page <= 1}>Sebelumnya</Button>
          </Link>
          <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
          <Link href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>Berikutnya</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 3: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/admin/orders/page.tsx ~/projects/Bubblepi-Store/app/admin/orders/page.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: admin orders — pagination + search by name/email/order#" && git push origin main
```

---

### Task 12: Add warranty claim section on order status page

**Problem:** Buyers with warranty have no clear path to claim. No connection to support.

**Files:**
- Modify: `app/(store)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: order.items with variant.hasWarranty, variant.warrantyDays
- Produces: Warranty claim card with WhatsApp/IG link

- [ ] **Step 1: Update order query to include warranty info**

In the `loadOrder` fetch, the API already returns items with variants. Ensure the order API (`app/api/orders/[id]/route.ts`) includes variant data:

```typescript
// In GET handler:
const order = await db.order.findUnique({
  where: { id },
  include: {
    items: { include: { variant: true } },
    stocks: true,
  },
})
```

- [ ] **Step 2: Add warranty claim section**

In `app/(store)/orders/[id]/page.tsx`, after the CredentialsCard section, add:

```tsx
{/* Warranty claim */}
{order.status === "FULFILLED" && (() => {
  const warrantyItems = (order.items as any[]).filter((i: any) => i.variant?.hasWarranty)
  if (warrantyItems.length === 0) return null
  const maxWarrantyDays = Math.max(...warrantyItems.map((i: any) => i.variant.warrantyDays ?? 0))
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "https://wa.me/"

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardContent className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          🛡️ Klaim Garansi
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Garansi aktif selama {maxWarrantyDays} hari sejak pembelian.
          Jika akun bermasalah, hubungi kami untuk penggantian.
        </p>
        <a
          href={`${supportUrl}?text=${encodeURIComponent(`Halo, saya ingin klaim garansi untuk order #${order.orderNumber}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2">
            💬 Hubungi Support via WhatsApp
          </Button>
        </a>
      </CardContent>
    </Card>
  )
})()}
```

- [ ] **Step 3: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 4: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/orders/\[id\]/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/orders/\[id\]/page.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: warranty claim section on order status page" && git push origin main
```

---

### Task 13: Add product badges (Stok Terbatas) on product cards

**Problem:** No social proof or urgency signals on product cards.

**Files:**
- Modify: `components/store/ProductCard.tsx`
- Modify: `app/(store)/page.tsx` (pass stock data)
- Modify: `app/(store)/products/page.tsx` (pass stock data)

**Interfaces:**
- Consumes: product variant stock counts
- Produces: Badge "Stok Terbatas" on cards

- [ ] **Step 1: Update ProductCard to show badges**

```tsx
// Add to ProductCard Props:
interface Props {
  product: ProductWithVariants & { totalStock?: number }
}

// In component, before closing card:
{product.totalStock !== undefined && product.totalStock <= 10 && product.totalStock > 0 && (
  <div className="absolute top-3 right-3 z-10">
    <Badge variant="destructive" className="text-xs">Stok Terbatas</Badge>
  </div>
)}
```

- [ ] **Step 2: Query stock count in homepage**

In `app/(store)/page.tsx`:

```typescript
const productsWithStock = await Promise.all(
  products.map(async (p) => ({
    ...p,
    totalStock: p.variants.reduce(async (acc, v) => {
      const count = await db.accountStock.count({
        where: { variantId: v.id, status: "AVAILABLE" },
      })
      return (await acc) + count
    }, Promise.resolve(0)),
  }))
)
```

- [ ] **Step 3: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 4: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/components/store/ProductCard.tsx ~/projects/Bubblepi-Store/components/store/ProductCard.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/page.tsx
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/\(store\)/products/page.tsx ~/projects/Bubblepi-Store/app/\(store\)/products/page.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: 'Stok Terbatas' badge on product cards" && git push origin main
```

---

### Task 14: Add search to admin stock page

**Problem:** No search in admin stock. Hard to find variants with 50+ products.

**Files:**
- Modify: `app/admin/stock/page.tsx`

**Interfaces:**
- Consumes: searchParams (search)
- Produces: Filtered variant list

- [ ] **Step 1: Add search to stock page**

In `app/admin/stock/page.tsx`:

```tsx
interface Props { searchParams: Promise<{ search?: string }> }

export default async function AdminStockPage({ searchParams }: Props) {
  const { search } = await searchParams

  const where: any = {}
  if (search) {
    where.OR = [
      { product: { name: { contains: search, mode: "insensitive" } } },
      { name: { contains: search, mode: "insensitive" } },
    ]
  }

  const variants = await db.variant.findMany({
    where,
    include: {
      product: { select: { name: true } },
      stock: true,
    },
    orderBy: { product: { name: "asc" } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stok</h1>
        <p className="text-muted-foreground mt-1">Kelola credentials per varian produk</p>
      </div>

      <form className="flex gap-2">
        <Input name="search" placeholder="Cari produk atau varian..." defaultValue={search ?? ""} className="max-w-sm" />
        <Button type="submit">Cari</Button>
      </form>

      <div className="space-y-2">
        {variants.map((variant) => {
          const available = variant.stock.filter((s) => s.status === "AVAILABLE").length
          const isCritical = available < 5

          return (
            <div key={variant.id} className="flex items-center justify-between p-4 bg-card border rounded-xl transition-colors hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {isCritical ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Archive className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold">{variant.product.name} — {variant.name}</p>
                  <p className="text-sm text-muted-foreground">{variant.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={isCritical ? "destructive" : "default"}>{available} tersedia</Badge>
                <Link href={`/admin/stock/${variant.id}`}>
                  <Button variant="outline" size="sm">Kelola</Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build verify**

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5
```

- [ ] **Step 3: Sync + commit + push**

```bash
cp ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/app/admin/stock/page.tsx ~/projects/Bubblepi-Store/app/admin/stock/page.tsx
cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: admin stock — search by product/variant name" && git push origin main
```

---

## Summary

| # | Task | Type | Impact |
|---|------|------|--------|
| 1 | Fix webhook token validation | 🐛 Bug fix | Auto-fulfill works again |
| 2 | Fix productSchema image validation | 🐛 Bug fix | Admin can add products |
| 3 | Fix double-submit + toast errors | 🐛 Bug fix | No duplicate orders |
| 4 | Fix paidAt + stock DELIVERED status | 🐛 Bug fix | Accurate timestamps + dashboard |
| 5 | Persist cart to localStorage | 🚀 Feature | Cart survives refresh |
| 6 | Telegram admin notifications | 🚀 Feature | Admin knows when orders arrive |
| 7 | Product type + warranty schema | 🚀 Feature | Core business data |
| 8 | Stock count per variant | 🚀 Feature | Buyer transparency |
| 9 | "Cara Kerja" homepage section | 🎨 UX | Onboarding for new buyers |
| 10 | Order lookup by email | 🚀 Feature | Buyers can find their orders |
| 11 | Admin orders pagination + search | 🎨 UX | Scalable admin |
| 12 | Warranty claim section | 🚀 Feature | After-sales flow |
| 13 | Product badges (Stok Terbatas) | 🎨 UX | Urgency signals |
| 14 | Admin stock search | 🎨 UX | Find variants fast |
