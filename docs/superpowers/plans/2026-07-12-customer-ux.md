# Bubblepi Customer UX — Phase 2 & 3 Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Bubblepi Store customer experience with price transparency, social proof, warranty management, reviews, PWA support, and convenience features across 13 incremental tasks.

**Architecture:** Each task adds a self-contained feature slice — new API route, UI component, or schema change — that can be built and verified independently. Database schema changes (resendCount, WarrantyClaim, Review) use Prisma migrations applied before dependent UI tasks. All server pages querying the database require `export const dynamic = "force-dynamic"`.

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


### Task 1: Harga per hari + Badge "Paling Worth"

**Files:**
- Modify: `components/store/AddToCartButton.tsx`
- Modify: `app/(store)/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Variant[]` from product detail page (server component)
- Produces: pricePerDay computed values, badge UI

- [ ] Add duration-to-days parser helper in product detail server component:

```typescript
// app/(store)/products/[slug]/page.tsx
function parseDurationToDays(duration: string): number {
  const map: Record<string, number> = {
    "1 Bulan": 30, "1 Month": 30,
    "3 Bulan": 90, "3 Months": 90,
    "6 Bulan": 180, "6 Months": 180,
    "1 Tahun": 365, "1 Year": 365,
  };
  return map[duration] || 30;
}
```

- [ ] Compute pricePerDay for each variant and identify cheapest:

```typescript
const variantsWithPricePerDay = product.variants.map((v) => ({
  ...v,
  pricePerDay: Math.round(v.price / parseDurationToDays(v.duration)),
}));

const cheapestPerDay = variantsWithPricePerDay.length > 1
  ? Math.min(...variantsWithPricePerDay.map((v) => v.pricePerDay))
  : null;
```

- [ ] Modify AddToCartButton to accept pricePerDay and isBestValue props:

```typescript
// components/store/AddToCartButton.tsx
interface AddToCartButtonProps {
  variants: Array<{
    id: string;
    name: string;
    duration: string;
    price: number;
    pricePerDay: number;
  }>;
  productId: string;
  productName: string;
  isBestValue?: boolean;
}

export function AddToCartButton({ variants, productId, productName, isBestValue = false }: AddToCartButtonProps) {
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const { addItem } = useCart();
  const toast = useToast();

  return (
    <div className="space-y-3">
      <RadioGroup value={selectedVariant.id} onValueChange={(id) => setSelectedVariant(variants.find((v) => v.id === id)!)}>
        {variants.map((variant) => (
          <div key={variant.id} className="relative">
            <RadioGroupItem value={variant.id} id={variant.id} className="peer sr-only" />
            <Label htmlFor={variant.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition-all hover:border-[#F4ABC4] peer-data-[state=checked]:border-[#595B83] peer-data-[state=checked]:bg-[#595B83]/5">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{variant.name} — {variant.duration}</span>
                  {variant.pricePerDay === cheapestPerDay && variants.length > 1 && (
                    <span className="rounded-full bg-[#F4ABC4] px-2 py-0.5 text-xs font-semibold text-[#333456]">
                      ✨ Paling Worth
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  = Rp {variant.pricePerDay.toLocaleString("id-ID")}/hari
                </span>
              </div>
              <span className="text-lg font-bold text-[#333456]">
                Rp {variant.price.toLocaleString("id-ID")}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      <Button onClick={() => {
        addItem({
          productId,
          productName,
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          duration: selectedVariant.duration,
          price: selectedVariant.price,
          quantity: 1,
        });
        toast.success("Ditambahkan ke keranjang!");
      }} className="w-full bg-[#595B83] hover:bg-[#333456] text-white">
        Tambah ke Keranjang
      </Button>
    </div>
  );
}
```

- [ ] Update product detail page to pass computed props.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 2: Copy credentials 1 klik

**Files:**
- Modify: `components/store/CredentialsCard.tsx`

**Interfaces:**
- Consumes: credentials string from order fulfillment data
- Produces: copy button UI per credential line

- [ ] Rewrite CredentialsCard with copy-per-line functionality:

```typescript
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CredentialLine {
  label: string;
  value: string;
}

function parseCredentials(raw: string): CredentialLine[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  return lines.map((line, i) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      return { label: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
    }
    return { label: "Kredensial " + (i + 1), value: line.trim() };
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6 shrink-0">
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-400" />
      )}
    </Button>
  );
}

export function CredentialsCard({ credentials, title = "Kredensial Akun" }: { credentials: string; title?: string }) {
  const lines = parseCredentials(credentials);

  return (
    <div className="rounded-lg border border-[#F4ABC4] bg-[#F4ABC4]/10 p-4">
      <h4 className="mb-3 font-semibold text-[#333456]">{title}</h4>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-white p-2">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-gray-500">{line.label}</span>
              <p className="truncate font-mono text-sm text-[#333456]">{line.value}</p>
            </div>
            <CopyButton text={line.value} />
          </div>
        ))}
      </div>
    </div>
  );
}
```
#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 3: Counter "X terjual" per produk

**Files:**
- Modify: `app/(store)/products/page.tsx`
- Modify: `components/store/ProductCard.tsx`
- Modify: `app/(store)/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: OrderItem aggregate data from Prisma
- Produces: soldCount displayed on product cards and detail pages

- [ ] Add sold count query in products listing page:

```typescript
// app/(store)/products/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 3600;

import { prisma } from "@/lib/db";

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  // Get sold counts per variant
  const soldCounts = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: { order: { status: "FULFILLED" } },
    _sum: { quantity: true },
  });

  const variantSoldMap = new Map(
    soldCounts.map((sc) => [sc.variantId, sc._sum.quantity ?? 0])
  );

  // Aggregate to product level
  const productSoldMap = new Map<string, number>();
  for (const product of products) {
    let totalSold = 0;
    for (const variant of product.variants) {
      totalSold += variantSoldMap.get(variant.id) ?? 0;
    }
    if (totalSold > 0) productSoldMap.set(product.id, totalSold);
  }

  return products.map((p) => ({ ...p, soldCount: productSoldMap.get(p.id) ?? 0 }));
}
```

- [ ] Update ProductCard to show sold count:

```typescript
// components/store/ProductCard.tsx
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    category: string;
    variants: Array<{ price: number }>;
    soldCount?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));

  return (
    <Link href={"/products/" + product.slug} className="group block">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
        <div className="relative aspect-square bg-gray-100">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">📦</div>
          )}
          {(product.soldCount ?? 0) > 0 && (
            <span className="absolute top-2 right-2 rounded-full bg-[#F4ABC4] px-2 py-0.5 text-xs font-semibold text-[#333456]">
              🔥 {product.soldCount} terjual
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-[#333456] group-hover:text-[#595B83]">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
          <p className="mt-2 text-lg font-bold text-[#595B83]">
            Rp {minPrice.toLocaleString("id-ID")}
            {minPrice !== maxPrice && (" - Rp " + maxPrice.toLocaleString("id-ID"))}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] Add per-variant sold count in product detail page.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 4: Kirim ulang email credentials

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/orders/[id]/resend-email/route.ts`
- Modify: `app/(store)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: Order status, resendCount, sendAccountDelivery from lib/order
- Produces: Resent email delivery, incremented resendCount

- [ ] Add resendCount to Order schema:

```prisma
// prisma/schema.prisma — Order model
model Order {
  // ... existing fields ...
  resendCount Int @default(0)
}
```

- [ ] Run migration:

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration
node_modules/.bin/prisma migrate dev --name add-order-resend-count
```

- [ ] Create resend-email API route:

```typescript
// app/api/orders/[id]/resend-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAccountDelivery } from "@/lib/order";
import { sendTelegram } from "@/lib/telegram";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      stocks: { include: { variant: { include: { product: true } } } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "FULFILLED") return NextResponse.json({ error: "Hanya order FULFILLED yang bisa kirim ulang" }, { status: 400 });
  if (order.resendCount >= 3) return NextResponse.json({ error: "Sudah dikirim 3x, hubungi support" }, { status: 429 });

  try {
    await sendAccountDelivery(order);
    await prisma.order.update({
      where: { id },
      data: { resendCount: { increment: 1 } },
    });
    await sendTelegram("📧 Email re-sent untuk #" + order.orderNumber + " (" + (order.resendCount + 1) + "/3)");
    return NextResponse.json({ success: true, resendCount: order.resendCount + 1 });
  } catch (err) {
    console.error("Resend email error:", err);
    return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 });
  }
}
```

- [ ] Add resend button in order status page.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 5: Re-order 1 klik

**Files:**
- Modify: `app/(store)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: OrderItem[] with variant data, useCart hook, stock availability
- Produces: Cart items added, redirect to /cart

- [ ] Add "Beli Lagi" button component in order status page:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface OrderItemData {
  variantId: string;
  variant: {
    id: string;
    name: string;
    duration: string;
    price: number;
    product: { id: string; name: string; slug: string };
    _count: { select: { accounts: { where: { status: "AVAILABLE" } } } };
  };
  quantity: number;
}

function ReorderButton({ items }: { items: OrderItemData[] }) {
  const { addItem, clearCart } = useCart();
  const router = useRouter();

  const handleReorder = async () => {
    clearCart();
    let addedCount = 0;

    for (const item of items) {
      const availableStock = item.variant._count.accounts;
      if (availableStock > 0) {
        addItem({
          productId: item.variant.product.id,
          productName: item.variant.product.name,
          variantId: item.variant.id,
          variantName: item.variant.name,
          duration: item.variant.duration,
          price: item.variant.price,
          quantity: item.quantity,
        });
        addedCount++;
      } else {
        toast.warning("Stok " + item.variant.product.name + " — " + item.variant.name + " habis, tidak ditambahkan");
      }
    }

    if (addedCount > 0) {
      toast.success(addedCount + " item ditambahkan ke keranjang");
      router.push("/cart");
    }
  };

  return (
    <Button onClick={handleReorder} className="bg-[#595B83] hover:bg-[#333456] text-white">
      <ShoppingCart className="mr-2 h-4 w-4" />
      Beli Lagi
    </Button>
  );
}
```
#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 6: Perbandingan varian side-by-side

**Files:**
- Create: `components/store/VariantCompareTable.tsx`
- Modify: `app/(store)/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: Variant[] with pricePerDay, stock count
- Produces: Toggle between card view and comparison table view

- [ ] Create VariantCompareTable component:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface VariantRow {
  id: string;
  name: string;
  duration: string;
  price: number;
  pricePerDay: number;
  hasWarranty: boolean;
  warrantyDays: number | null;
  stockCount: number;
  isBestValue: boolean;
}

interface VariantCompareTableProps {
  variants: VariantRow[];
  onSelect: (variantId: string) => void;
}

export function VariantCompareTable({ variants, onSelect }: VariantCompareTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#595B83] text-white">
            <th className="px-4 py-3 text-left">Varian</th>
            <th className="px-4 py-3 text-right">Harga</th>
            <th className="px-4 py-3 text-left">Durasi</th>
            <th className="px-4 py-3 text-right">Harga/Hari</th>
            <th className="px-4 py-3 text-center">Garansi</th>
            <th className="px-4 py-3 text-center">Stok</th>
            <th className="px-4 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.id} className={"border-b transition-colors hover:bg-gray-50" + (v.isBestValue ? " bg-[#F4ABC4]/10 ring-2 ring-inset ring-[#595B83]" : "")}>
              <td className="px-4 py-3 font-medium">
                {v.name}
                {v.isBestValue && <span className="ml-2 rounded-full bg-[#F4ABC4] px-2 py-0.5 text-xs font-semibold text-[#333456]">✨ Paling Worth</span>}
              </td>
              <td className="px-4 py-3 text-right font-semibold">Rp {v.price.toLocaleString("id-ID")}</td>
              <td className="px-4 py-3">{v.duration}</td>
              <td className="px-4 py-3 text-right">Rp {v.pricePerDay.toLocaleString("id-ID")}</td>
              <td className="px-4 py-3 text-center">{v.hasWarranty ? v.warrantyDays + " hari" : "-"}</td>
              <td className="px-4 py-3 text-center">
                <span className={"font-semibold " + (v.stockCount > 0 ? "text-green-600" : "text-red-500")}>
                  {v.stockCount > 0 ? v.stockCount : "Habis"}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <Button size="sm" onClick={() => onSelect(v.id)} disabled={v.stockCount === 0} className="bg-[#595B83] text-white hover:bg-[#333456]">
                  <ShoppingCart className="mr-1 h-3 w-3" /> Pilih
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] Add toggle in product detail page between "Kartu" and "Bandingkan" views.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 7: Garansi timer per order

**Files:**
- Create: `components/store/WarrantyTimer.tsx`
- Modify: `app/(store)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: paidAt (Date), warrantyDays (number), variant hasWarranty flag
- Produces: Countdown display, progress bar with color coding

- [ ] Create WarrantyTimer component:

```typescript
"use client";

import { useState, useEffect } from "react";

interface WarrantyTimerProps {
  paidAt: string;
  warrantyDays: number;
}

function calculateWarrantyRemaining(paidAt: string, warrantyDays: number) {
  const paid = new Date(paidAt);
  const expiry = new Date(paid.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const totalMs = warrantyDays * 24 * 60 * 60 * 1000;
  const remainingMs = expiry.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return { expired: true, days: 0, hours: 0, percent: 0 };
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const percent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  return { expired: false, days, hours, percent };
}

export function WarrantyTimer({ paidAt, warrantyDays }: WarrantyTimerProps) {
  const [remaining, setRemaining] = useState(() => calculateWarrantyRemaining(paidAt, warrantyDays));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(calculateWarrantyRemaining(paidAt, warrantyDays));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [paidAt, warrantyDays]);

  const getProgressColor = (percent: number) => {
    if (percent > 50) return "bg-green-500";
    if (percent > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="rounded-lg border border-[#F4ABC4] bg-[#F4ABC4]/10 p-4">
      <h4 className="mb-2 font-semibold text-[#333456]">Status Garansi</h4>
      {remaining.expired ? (
        <p className="text-sm text-gray-500">Garansi sudah berakhir</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#333456]">
            Garansi aktif {remaining.days} hari {remaining.hours} jam lagi
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className={"h-full rounded-full transition-all " + getProgressColor(remaining.percent)} style={{ width: remaining.percent + "%" }} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Integrate in order status page.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 8: One-click klaim garansi

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/warranty/route.ts`
- Modify: `app/(store)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: Order with items, WarrantyClaim data
- Produces: WarrantyClaim record, Telegram notification to admin

- [ ] Add WarrantyClaim schema:

```prisma
// prisma/schema.prisma
model WarrantyClaim {
  id          String    @id @default(cuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id])
  orderItemId String
  orderItem   OrderItem @relation(fields: [orderItemId], references: [id])
  description String
  status      String    @default("PENDING") // PENDING | APPROVED | REJECTED
  resolveNote String?
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?

  @@index([orderId])
  @@index([status])
}
```

- [ ] Run migration.

- [ ] Create warranty API route.

- [ ] Add warranty claim form in order status page.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 9: Verified review per produk

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/reviews/route.ts`
- Create: `components/store/ReviewSection.tsx`
- Modify: `app/(store)/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: FULFILLED order validation, Review CRUD
- Produces: Review records, avg rating display, star UI

- [ ] Add Review schema:

```prisma
// prisma/schema.prisma
model Review {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id])
  rating     Int      // 1-5
  comment    String
  isVisible  Boolean  @default(true)
  isPinned   Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@unique([orderId, productId])
  @@index([productId])
  @@index([isVisible])
}
```

- [ ] Run migration.
- [ ] Create reviews API at `app/api/reviews/route.ts` (POST to create, GET to fetch with avg rating).
- [ ] Create ReviewSection component with star rating display.
- [ ] Integrate in product detail page.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 10: QR code invoice

**Files:**
- Modify: `components/store/CheckoutStep3.tsx`

**Interfaces:**
- Consumes: paymentUrl from Xendit invoice
- Produces: QR code display for payment

- [ ] Install qrcode.react:

```bash
cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration
pnpm add qrcode.react
```

- [ ] Add QR code to CheckoutStep3:

```typescript
"use client";

import { QRCodeSVG } from "qrcode.react";

interface CheckoutStep3Props {
  orderNumber: string;
  paymentUrl: string | null;
  status: string;
}

export function CheckoutStep3({ orderNumber, paymentUrl, status }: CheckoutStep3Props) {
  if (status === "FULFILLED" || !paymentUrl) return null;

  return (
    <div className="flex flex-col items-center space-y-4 rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-[#333456]">Scan untuk Bayar</h3>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <QRCodeSVG value={paymentUrl} size={200} bgColor="#ffffff" fgColor="#333456" level="M" />
      </div>
      <p className="text-center text-sm text-gray-500">
        Scan QR code ini dari HP lain untuk membayar
      </p>
      <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#595B83] underline hover:text-[#333456]">
        Atau buka link pembayaran langsung →
      </a>
    </div>
  );
}
```


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`


---

### Task 11: PWA — Add to homescreen

**Files:**
- Create: `app/manifest.ts`
- Create: `public/sw.js`
- Create: `components/SwRegister.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: Web app metadata (name, icons, theme color)
- Produces: PWA manifest, service worker registration

- [ ] Create manifest.ts:

```typescript
// app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bubblepi Store",
    short_name: "Bubblepi",
    description: "Beli akun premium dengan harga terjangkau",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#595B83",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

- [ ] Create minimal service worker at `public/sw.js`
- [ ] Create SwRegister client component
- [ ] Update layout.tsx with theme-color meta and SW registration


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 12: Social proof — bukti fulfillment real-time

**Files:**
- Create: `components/store/LiveFulfillmentBadge.tsx`
- Modify: `app/(store)/page.tsx`

**Interfaces:**
- Consumes: Last FULFILLED order, last DELIVERED AccountStock
- Produces: Real-time fulfillment badge with auto-refresh

- [ ] Create LiveFulfillmentBadge server component:

```typescript
// components/store/LiveFulfillmentBadge.tsx
import { prisma } from "@/lib/db";

async function getLatestFulfillment() {
  const lastOrder = await prisma.order.findFirst({
    where: { status: "FULFILLED" },
    orderBy: { paidAt: "desc" },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });

  if (!lastOrder || !lastOrder.paidAt) return null;

  const minutesAgo = Math.floor((Date.now() - lastOrder.paidAt.getTime()) / (1000 * 60));
  const productNames = lastOrder.items
    .map((i) => i.variant.product.name)
    .filter((name, idx, arr) => arr.indexOf(name) === idx);

  return { productName: productNames.join(", "), minutesAgo };
}

export async function LiveFulfillmentBadge() {
  const fulfillment = await getLatestFulfillment();
  if (!fulfillment) return null;

  const timeText = fulfillment.minutesAgo < 60
    ? fulfillment.minutesAgo + " menit lalu"
    : Math.floor(fulfillment.minutesAgo / 60) + " jam lalu";

  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-[#F4ABC4]/20 px-4 py-2 text-sm text-[#333456]">
      <span className="animate-pulse">⚡</span>
      <span>Terakhir fulfill: <strong>{fulfillment.productName}</strong> — {timeText}</span>
    </div>
  );
}
```

- [ ] Add to homepage below HowItWorks.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`


---

### Task 13: Share order ke WA

**Files:**
- Modify: `app/(store)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: Order data (orderNumber, product names)
- Produces: WhatsApp share link

- [ ] Add WhatsApp share button in fulfilled order view:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

function WhatsAppShareButton({ orderNumber, productNames, orderUrl }: {
  orderNumber: string;
  productNames: string[];
  orderUrl: string;
}) {
  const text = encodeURIComponent(
    "Saya baru beli " + productNames.join(", ") + " di Bubblepi Store! Cek pesananku: " + orderUrl
  );

  return (
    <a href={"https://wa.me/?text=" + text} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
        <MessageCircle className="mr-2 h-4 w-4" />
        Bagikan ke WhatsApp
      </Button>
    </a>
  );
}
```
#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`
