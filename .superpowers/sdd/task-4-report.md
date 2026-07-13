# Task 4 Report — Storefront UX: Stock, Search, Filter, Skeleton, Related Products

**Date:** 2026-07-13
**Branch:** feat/prod-hardening
**Commit:** b9f2bc1

## Status: DONE

## Files Created

| File | Description |
|------|-------------|
| `components/product/stock-badge.tsx` | "Tersisa X" (amber ≤5) / "Stok habis" (red) / null (healthy) |
| `components/product/product-grid-skeleton.tsx` | 8 skeleton cards matching ProductCard layout |
| `components/product/product-detail-skeleton.tsx` | Skeleton for detail page (image, breadcrumb, variants) |
| `components/product/related-products.tsx` | Re-export from `components/store/RelatedProducts` |

## Files Modified

| File | Changes |
|------|---------|
| `components/store/FilterSidebar.tsx` | Added sort Select (price_asc/desc/popular), dynamic `categories` prop, debounced search via useEffect, `router.replace` (no full reload) |
| `app/(store)/products/page.tsx` | Fetch distinct categories from DB, pass to FilterSidebar, extract `ProductList` as async sub-component wrapped in `<Suspense fallback={<ProductGridSkeleton/>}>`, JS post-sort for price/popular |
| `app/(store)/products/[slug]/page.tsx` | Import `StockBadge`, render per-variant stock badges, wrap `RelatedProducts` in `<Suspense>` with inline skeleton fallback |

## Already Existed (no action needed)

- `components/ui/skeleton.tsx` — already present (shadcn)
- `components/store/RelatedProducts.tsx` — already implemented and wired in slug page
- Per-variant stock logic in slug page — already present via `stockMap`

## Build Result

```
✓ Compiled successfully in 18.8s
✓ TypeScript passed (11.7s)
✓ 36/36 static pages generated
Exit code: 0 — 0 errors
```

Note: `ReferenceError: location is not defined` during static generation is a pre-existing issue in the checkout page, not introduced by this task.

## Commit SHA

`b9f2bc1`
