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
  const maxPrice = Math.max(...product.variants.map((v) => v.price))

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border hover:border-primary/30">
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">{getCategoryEmoji(product.category)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <Badge className="absolute top-3 left-3 bg-white/90 text-foreground backdrop-blur-sm border-0">
            {product.category}
          </Badge>
          {"totalStock" in product && typeof product.totalStock === "number" && product.totalStock <= 10 && product.totalStock > 0 && (
            <Badge variant="destructive" className="absolute top-3 right-3 text-xs">
              Stok Terbatas
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              {product.variants.length} varian
            </span>
            <span className="font-bold text-primary">
              {formatPrice(minPrice)}
              {maxPrice !== minPrice && <span className="text-xs text-muted-foreground font-normal">+</span>}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function getCategoryEmoji(category: string): string {
  switch (category) {
    case "streaming": return "📺"
    case "ai": return "🤖"
    case "design": return "🎨"
    default: return "📦"
  }
}
