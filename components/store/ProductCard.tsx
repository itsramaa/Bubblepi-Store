import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ArrowRight, Star } from "lucide-react"
import type { ProductWithVariants } from "@/types"

interface ProductCardProps {
  product: ProductWithVariants & { totalSold?: number; totalStock?: number }
}

export default function ProductCard({ product }: ProductCardProps) {
  const prices = product.variants.map((v) => v.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const isLowStock = (product.totalStock ?? 99) <= 3 && (product.totalStock ?? 99) > 0
  const isOutOfStock = product.totalStock === 0
  const isBestSeller = (product.totalSold ?? 0) >= 10

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="rounded-2xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#595B83]/10 to-[#F4ABC4]/10">
          <Image
            src={product.image || "/products/default.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
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

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xs text-muted-foreground">Mulai</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(minPrice)}
            </span>
            {maxPrice > minPrice && (
              <span className="text-xs text-muted-foreground">
                – {formatPrice(maxPrice)}
              </span>
            )}
          </div>

          {/* Sold count + CTA */}
          <div className="flex items-center justify-between">
            {(product.totalSold ?? 0) > 0 ? (
              <span className="text-xs text-muted-foreground">
                {product.totalSold}+ terjual
              </span>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-xs font-medium text-primary hover:bg-primary/10 h-7 px-3"
            >
              Lihat <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
