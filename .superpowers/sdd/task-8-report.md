# Task 8 Report — Revenue Features: Vouchers, Flash Sale, Trust Signals

**Date:** 2026-07-13T09:05:58Z  
**Branch:** feat/prod-hardening  
**Commit:** d1d109f  

## Status: ✅ COMPLETE

## TSC Result
```
npx tsc --noEmit → 0 errors
```

## Changes Made

### 1. `prisma/schema.prisma`
- Added `salePrice Int?` and `saleEndsAt DateTime?` to `Variant` model
- `npx prisma generate` ran successfully (Prisma Client v6.19.3)

### 2. `app/api/vouchers/validate/route.ts`
- Renamed param `total` → `cartTotal` to match spec `{ code, cartTotal }`
- All error responses now include `valid: false` alongside `error`
- Success response changed from `{ valid: true, voucher: { id, code, type, value, discount } }` to `{ valid: true, discount, voucherId, type, value }` per spec
- All validation checks already present: isActive, expiresAt, maxUses, minOrder

### 3. `components/product/sale-countdown.tsx` (created)
- Client component with 1-second interval countdown
- Shows `{h}j {m}m {s}d` or `{m}m {s}d` format
- Returns null when expired

### 4. `components/store/VariantCompareTable.tsx`
- Added `salePrice` and `saleEndsAt` to `Variant` interface
- `getEffectivePrice()` helper: returns sale price if active (saleEndsAt null or in future)
- Card mode: red flash sale ribbon, strikethrough original price, `SaleCountdown`, "Hemat X%" badge
- Compare mode: strikethrough price column, 🔥 Sale label
- Summary panel: red price, strikethrough original, countdown
- Cart/buy-now actions use effective (sale) price

### 5. `components/store/ProductCard.tsx`
- Added `avgRating` and `reviewCount` props
- `getMinEffectivePrice()` computes lowest sale-aware price across all variants
- Sale badge with `Tag` icon showing `-X%` max discount in image overlay
- Rating row with star icon below product name
- Sale price shown in red with strikethrough original

### 6. `app/(store)/products/page.tsx`
- Added `db.review.groupBy` query for `_avg.rating` and `_count.rating` per product
- `productsWithMeta` now carries `avgRating` and `reviewCount`
- Passed through to `ProductCard` via spread

## Concerns
- **Voucher response shape change**: any frontend code calling `/api/vouchers/validate` that reads `response.voucher.id` will break — it now reads `response.voucherId`. Callers (checkout flow) should be verified.
- **No migration**: `salePrice`/`saleEndsAt` added to schema only; `prisma migrate dev` not run (no live DB in worktree). Migration must be applied in production before deploying.
- **pricePerDay for sale variants**: compare table shows `pricePerDay` based on original price, not sale price — intentional (sale is temporary).
