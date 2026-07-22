import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ArrowRight, Star } from "lucide-react"
import type { ProductWithVariants } from "@/types"

interface ProductCardProps {
  product: ProductWithVariants & {
    totalSold?: number
    totalStock?: number
    avgRating?: number
    reviewCount?: number
  }
}

/** Returns the lowest price across all variants */
function getMinPrice(product: ProductWithVariants): number {
  if (!product.variants.length) return 0
  return Math.min(...product.variants.map((v) => v.price))
}

/** Check if product was created within the last 7 days */
function isNewProduct(product: ProductWithVariants): boolean {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return new Date(product.createdAt ?? "") > sevenDaysAgo
}

export default function ProductCard({ product }: ProductCardProps) {
  const prices = product.variants.map((v) => v.price)
  const maxPrice = Math.max(...prices)
  const minPrice = getMinPrice(product)
  const isLowStock = (product.totalStock ?? 99) <= 3 && (product.totalStock ?? 99) > 0
  const isOutOfStock = product.totalStock === 0
  const isBestSeller = (product.totalSold ?? 0) >= 10
  const isNew = isNewProduct(product)

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Card: property-card spec — rounded-md, white surface, no shadow default, hover float */}
      <div className="card-property border border-hairline group-hover:shadow-card-hover transition-shadow duration-300">
        {/* Photo plate — rounded-md clipping, 4:3 aspect */}
        <div className="card-property-photo relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#595B83]/10 to-[#F4ABC4]/10">
          <Image
            src={product.image || "/products/default.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
          />
          {/* Floating badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {isNew && (
              <Badge className="bg-canvas text-ink text-[11px] font-semibold border border-hairline rounded-full px-2.5 py-0.5 shadow-sm">
                Baru
              </Badge>
            )}
            {isBestSeller && (
              <div className="guest-favorite-badge flex items-center gap-1 shadow-sm">
                <Star className="h-3 w-3 fill-current" />
                Terlaris
              </div>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="inline-flex items-center rounded-full bg-canvas text-ink text-[11px] font-semibold border border-hairline px-2.5 py-0.5 shadow-sm">
                Stok Terbatas
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center rounded-full bg-surface-soft text-muted text-[11px] font-semibold border border-hairline px-2.5 py-0.5 shadow-sm">
                Habis
              </span>
            )}
          </div>
        </div>

        {/* Meta block — body-sm spacing */}
        <div className="p-4 space-y-1">
          <p className="text-body-sm text-muted uppercase tracking-wide font-medium">
            {product.category}
          </p>
          <h3 className="text-title-md line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating — ink star */}
          {product.avgRating != null && product.reviewCount != null && product.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-star-rating text-star-rating" />
              <span className="text-body-sm font-medium">{product.avgRating.toFixed(1)}</span>
              <span className="text-body-sm text-muted">({product.reviewCount})</span>
            </div>
          )}

          {/* Terjual count */}
          {(product.totalSold ?? 0) > 0 && (
            <p className="text-body-sm text-muted">Terjual {product.totalSold}+</p>
          )}

          {/* Price — display-sm for emphasis */}
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-body-sm text-muted">Mulai</span>
            <span className="text-display-sm text-primary font-bold">
              {formatPrice(minPrice)}
            </span>
            {maxPrice > minPrice && (
              <span className="text-body-sm text-muted">– {formatPrice(maxPrice)}</span>
            )}
          </div>

          {/* CTA — tertiary-text style */}
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-body-sm font-medium text-muted hover:text-ink h-7 px-0"
            >
              Lihat <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}