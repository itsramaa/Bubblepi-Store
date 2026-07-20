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
  return new Date(product.createdAt) > sevenDaysAgo
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
      {/* Card: subtle lift + inner shadow on hover */}
      <div className="rounded-2xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgba(89,91,131,0.08)] transition-all duration-300">
        {/* Image with blur placeholder skeleton */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#595B83]/10 to-[#F4ABC4]/10" style={{ boxShadow: 'inset 0 -2px 10px rgba(0,0,0,0.05)' }}>
          <Image
            src={product.image || "/products/default.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
          />
          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {isNew && (
              <Badge className="bg-blue-500 text-white text-xs font-semibold gap-1 border-0">
                Baru
              </Badge>
            )}
            {isBestSeller && (
              <Badge className="bg-[#F4ABC4] text-[#333456] text-xs font-semibold gap-1 border-0">
                <Star className="h-3 w-3 fill-current" /> Terlaris
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Stok Terbatas
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="text-xs opacity-80">
                Habis
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
            {product.category}
          </p>
          <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.avgRating != null && product.reviewCount != null && product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{product.avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
          )}

          {/* Terjual count — below rating */}
          {(product.totalSold ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              Terjual {product.totalSold}+
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xs text-muted-foreground">Mulai</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(minPrice)}
            </span>
            {maxPrice > minPrice ? (
              <span className="text-xs text-muted-foreground">
                – {formatPrice(maxPrice)}
              </span>
            ) : null}
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-7 px-3 transition-all"
            >
              Lihat <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
