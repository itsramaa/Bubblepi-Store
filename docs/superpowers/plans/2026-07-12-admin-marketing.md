# Bubblepi Admin Marketing — SEO, Voucher, Referral, Upsell, Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow Bubblepi Store traffic and revenue through SEO optimization, promotional tools (vouchers, referrals), upsell mechanics, analytics tracking, and admin management features across 14 tasks.

**Architecture:** Tasks 1-2 handle SEO metadata (no schema changes). Task 3 introduces the Voucher system with schema + admin CRUD + checkout integration. Tasks 4-8 add marketing features (social proof, category landing pages, urgency, upsell). Task 9 adds UTM tracking via middleware. Tasks 10-12 provide admin management for warranties, reviews, and testimonials. Tasks 13-14 add cart recovery and referral systems.

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


### Task 1: SEO metadata + sitemap + robots

**Files:**
- Modify: `app/(store)/products/[slug]/page.tsx`
- Modify: `app/(store)/products/page.tsx`
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

**Interfaces:**
- Consumes: Product data for metadata generation
- Produces: Next.js metadata objects, sitemap XML, robots.txt

- [ ] Add generateMetadata to product detail page:

```typescript
// app/(store)/products/[slug]/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });

  if (!product) return { title: "Produk tidak ditemukan" };

  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bubblepi.store";

  return {
    title: "Beli " + product.name + " Murah - Bubblepi Store",
    description: product.description || ("Beli " + product.name + " dengan harga Rp " + minPrice.toLocaleString("id-ID") + " di Bubblepi Store"),
    openGraph: {
      title: "Beli " + product.name + " Murah - Bubblepi Store",
      description: product.description || ("Beli " + product.name + " dengan harga terjangkau"),
      url: baseUrl + "/products/" + product.slug,
      siteName: "Bubblepi Store",
      images: product.image ? [{ url: product.image, width: 1200, height: 630 }] : [],
      type: "website",
    },
  };
}
```

- [ ] Add generateMetadata to products listing page.
- [ ] Create sitemap.ts generating entries for all active products + static pages.
- [ ] Create robots.ts allowing all, pointing to sitemap URL.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 2: Open Graph + Twitter Card tags

**Files:**
- Modify: `app/(store)/products/[slug]/page.tsx` (extend Task 1 metadata)

**Interfaces:**
- Consumes: Product data with image
- Produces: Full OG + Twitter Card metadata

- [ ] Extend generateMetadata with full OG and Twitter fields:

```typescript
// Extend Task 1 generateMetadata with:
return {
  title: "Beli " + product.name + " Murah - Bubblepi Store",
  description: product.description || "...",
  openGraph: {
    title: "Beli " + product.name + " Murah - Bubblepi Store",
    description: product.description || "...",
    url: baseUrl + "/products/" + product.slug,
    siteName: "Bubblepi Store",
    images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beli " + product.name + " Murah - Bubblepi Store",
    description: product.description || "...",
    images: imageUrl ? [imageUrl] : [],
  },
};
```
#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 3: Voucher / promo code system

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/vouchers/validate/route.ts`
- Create: `app/api/admin/vouchers/route.ts`
- Create: `app/admin/vouchers/page.tsx`
- Create: `app/admin/vouchers/new/page.tsx`
- Create: `app/admin/vouchers/[id]/page.tsx`
- Modify: `components/store/CheckoutStep2.tsx`
- Modify: `app/api/orders/route.ts`

**Interfaces:**
- Consumes: Voucher schema, Order schema (voucherId, discountAmount)
- Produces: Voucher CRUD, validation API, checkout discount calculation

- [ ] Add Voucher schema + Order extensions:

```prisma
// prisma/schema.prisma
model Voucher {
  id          String    @id @default(cuid())
  code        String    @unique
  type        String    // PERCENT | FIXED
  value       Int
  minOrder    Int       @default(0)
  maxUses     Int?
  usedCount   Int       @default(0)
  expiresAt   DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  orders      Order[]
}

// Add to Order model:
//   voucherId   String?
//   voucher     Voucher? @relation(fields: [voucherId], references: [id])
//   discountAmount Int @default(0)
```

- [ ] Run migration.
- [ ] Create voucher validation API (POST /api/vouchers/validate).
- [ ] Create admin vouchers API (GET list, POST create).
- [ ] Create admin voucher list page.
- [ ] Create admin voucher new page.
- [ ] Add voucher input in CheckoutStep2 with "Terapkan" button.
- [ ] Apply discount in /api/orders/route.ts before creating order.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 4: Counter terjual + Homepage social proof

**Files:**
- Create: `components/store/SocialProofBanner.tsx`
- Modify: `app/(store)/page.tsx`

**Interfaces:**
- Consumes: Order counts (FULFILLED total, today's FULFILLED)
- Produces: Social proof banner component

- [ ] Create SocialProofBanner:

```typescript
// components/store/SocialProofBanner.tsx
import { prisma } from "@/lib/db";

export async function SocialProofBanner() {
  const totalBuyers = await prisma.order.count({ where: { status: "FULFILLED" } });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySold = await prisma.orderItem.aggregate({
    where: { order: { status: "FULFILLED", paidAt: { gte: todayStart } } },
    _sum: { quantity: true },
  });

  const todayCount = todaySold._sum.quantity ?? 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl bg-gradient-to-r from-[#595B83] to-[#333456] px-6 py-4 text-white">
      <div className="text-center">
        <p className="text-2xl font-bold">{totalBuyers.toLocaleString("id-ID")}+</p>
        <p className="text-sm text-white/80">Pembeli Puas</p>
      </div>
      <div className="h-8 w-px bg-white/30" />
      <div className="text-center">
        <p className="text-2xl font-bold">{todayCount.toLocaleString("id-ID")}</p>
        <p className="text-sm text-white/80">Akun Terjual Hari Ini</p>
      </div>
      <div className="h-8 w-px bg-white/30" />
      <div className="text-center">
        <p className="text-2xl font-bold">⚡</p>
        <p className="text-sm text-white/80">Fulfillment Instan</p>
      </div>
    </div>
  );
}
```

- [ ] Add to homepage between HeroSection and FeaturedProducts.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`


---

### Task 5: Re-order 1 klik

> Reference: Implemented in Customer UX Plan — Task 5. Skip duplicate implementation.

---

### Task 6: Landing page per kategori

**Files:**
- Create: `app/(store)/kategori/[category]/page.tsx`
- Modify: `components/store/Navbar.tsx`
- Modify: `components/store/Footer.tsx`

**Interfaces:**
- Consumes: Product data filtered by category
- Produces: Category landing page with SEO metadata

- [ ] Create category page with dynamic route.
- [ ] Add category links to Navbar dropdown.
- [ ] Add category links to Footer.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 7: Urgency banner "Stok Terbatas"

**Files:**
- Modify: `app/(store)/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: Stock count per variant
- Produces: Urgency banner, disabled checkout when out of stock

- [ ] Add urgency banner when stock <= 10.
- [ ] Show "Habis" state with disabled checkout if all variants out of stock.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`


---

### Task 8: Upsell di checkout step 2

**Files:**
- Create: `app/api/products/upsell/route.ts`
- Modify: `components/store/CheckoutStep2.tsx`

**Interfaces:**
- Consumes: Cart items (to determine category), product catalog
- Produces: Upsell product suggestions

- [ ] Create upsell API returning max 2 products in same category with stock.
- [ ] Add upsell section in CheckoutStep2 with "Tambah" button.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 9: UTM tracking

**Files:**
- Create/Modify: `middleware.ts`
- Modify: `prisma/schema.prisma`
- Modify: `app/api/orders/route.ts`
- Modify: `app/admin/dashboard/page.tsx`

**Interfaces:**
- Consumes: UTM parameters from URL searchParams
- Produces: UTM cookie, Order UTM fields, Admin UTM analytics

- [ ] Add UTM fields to Order schema: `utmSource String?`, `utmMedium String?`, `utmCampaign String?`.
- [ ] Run migration.
- [ ] Add UTM capture middleware saving cookie for 30 days.
- [ ] Attach UTM data to order creation in /api/orders/route.ts.
- [ ] Add UTM breakdown table to admin dashboard.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 10: Admin warranty claim management

**Files:**
- Create: `app/admin/warranty/page.tsx`
- Create: `app/admin/warranty/[id]/page.tsx`
- Create: `app/api/admin/warranty/[id]/route.ts`

**Interfaces:**
- Consumes: WarrantyClaim schema (from Customer UX Plan Task 8)
- Produces: Admin warranty management UI, approve/reject actions

- [ ] Create warranty admin list page with filter by status.
- [ ] Create claim detail page with approve/reject actions.
- [ ] Create admin warranty API for approve (assign replacement stock, send email) and reject (with reason).


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 11: Admin review management

**Files:**
- Create: `app/admin/reviews/page.tsx`
- Create: `app/api/admin/reviews/route.ts`
- Modify: `components/admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes: Review schema (from Customer UX Plan Task 9)
- Produces: Admin review list with visibility toggle

- [ ] Create admin reviews API (GET list, PATCH toggle visibility/pin).
- [ ] Create admin reviews page with toggle buttons.
- [ ] Add Reviews link to AdminSidebar.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 12: Testimonial carousel di homepage (admin-pinned)

**Files:**
- Modify: `prisma/schema.prisma` (add isPinned to Review — already added in Task 9)
- Create: `components/store/TestimonialCarousel.tsx`
- Modify: `app/(store)/page.tsx`

**Interfaces:**
- Consumes: Pinned Review records
- Produces: Auto-scrolling testimonial carousel

- [ ] Create TestimonialCarousel with auto-scroll (5s interval), dot navigation.
- [ ] If no pinned reviews, hide section.
- [ ] Fetch pinned reviews in homepage server component.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`


---

### Task 13: Abandoned cart recovery

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/cart/save/route.ts`

**Interfaces:**
- Consumes: Cart items + customer email from CheckoutStep1
- Produces: AbandonedCart record (cron job handled in admin-automation Plan Task 9)

- [ ] Add AbandonedCart schema:

```prisma
// prisma/schema.prisma
model AbandonedCart {
  id        String   @id @default(cuid())
  email     String
  name      String?
  items     Json     // Array of cart items
  createdAt DateTime @default(now())
  recovered Boolean  @default(false)

  @@index([email])
  @@index([recovered, createdAt])
}
```

- [ ] Run migration.
- [ ] Create cart save API (POST /api/cart/save).
- [ ] Integrate in CheckoutStep1 — fire-and-forget call on email+name capture.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`


---

### Task 14: Referral system

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/referral/route.ts`
- Modify: `middleware.ts`
- Create: `app/admin/referrals/page.tsx`
- Modify: `app/(store)/orders/page.tsx`

**Interfaces:**
- Consumes: Buyer email -> referral code, cookie-based referral tracking
- Produces: Referral records, admin management UI, buyer referral link

- [ ] Add Referral schema:

```prisma
// prisma/schema.prisma
model Referral {
  id             String   @id @default(cuid())
  referrerEmail  String
  referreeEmail  String
  orderId        String?
  order          Order?   @relation(fields: [orderId], references: [id])
  commissionType String   // DISCOUNT | CREDIT
  commissionValue Int
  status         String   @default("PENDING") // PENDING | CONFIRMED | PAID
  createdAt      DateTime @default(now())

  @@index([referrerEmail])
  @@index([status])
}
```

- [ ] Run migration.
- [ ] Create referral API (GET referral info, POST create on FULFILLED order).
- [ ] Add referral cookie capture in middleware (/?ref=CODE).
- [ ] Create admin referrals list page.
- [ ] Add referral link display in orders page for customers.


#### Build Verify
- [ ] `cd ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration && npx next build 2>&1 | tail -5`

#### Sync & Commit
- [ ] `rsync -av --exclude='.next' --exclude='node_modules' --exclude='.git' ~/projects/Bubblepi-Store/.worktrees/feat-nextjs-migration/ ~/projects/Bubblepi-Store/`
- [ ] `cd ~/projects/Bubblepi-Store && git add -A && git commit -m "feat: <description>" && git push origin main`
