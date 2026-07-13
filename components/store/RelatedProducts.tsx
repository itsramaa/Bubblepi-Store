import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Tv, Bot, Palette, BookOpen, Gamepad2, Globe, Star, Users } from "lucide-react"

interface Props {
  productId: string
  category: string
}

const ICONS: Record<string, React.ElementType> = {
  streaming: Tv, ai: Bot, design: Palette, education: BookOpen, gaming: Gamepad2,
}

export default async function RelatedProducts({ productId, category }: Props) {
  const related = await db.product.findMany({
    where: { category, id: { not: productId }, isActive: true },
    include: { variants: { orderBy: { price: "asc" }, take: 1 } },
    take: 8, // fetch more so we can sort post-query
    orderBy: { createdAt: "desc" },
  })

  if (related.length === 0) return null

  // Attach sold count per product
  const relatedIds = related.map((p) => p.id)
  const soldData = await db.orderItem.groupBy({
    by: ["variantId"],
    where: {
      order: { status: "FULFILLED" },
      variant: { productId: { in: relatedIds } },
    },
    _sum: { quantity: true },
  })

  // Map variantId → sold, then aggregate per product
  const variantToProduct = new Map<string, string>()
  for (const p of related) {
    for (const v of p.variants) {
      variantToProduct.set(v.id, p.id)
    }
  }
  // We need all variants, not just the first one — re-query variant ids per product
  const allVariants = await db.variant.findMany({
    where: { productId: { in: relatedIds } },
    select: { id: true, productId: true },
  })
  for (const v of allVariants) {
    variantToProduct.set(v.id, v.productId)
  }

  const soldByProduct = new Map<string, number>()
  for (const s of soldData) {
    const productId = variantToProduct.get(s.variantId)
    if (productId) {
      soldByProduct.set(productId, (soldByProduct.get(productId) ?? 0) + (s._sum.quantity ?? 0))
    }
  }

  // Attach average rating per product
  const ratingData = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: relatedIds }, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const ratingMap = new Map(ratingData.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count.rating }]))

  // Sort by sold count desc, then take top 4
  const sorted = related
    .map((p) => ({ ...p, totalSold: soldByProduct.get(p.id) ?? 0, rating: ratingMap.get(p.id) }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 4)

  const Icon = ICONS[category] ?? Globe

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold mb-6">Produk Serupa</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sorted.map((p) => {
          const minPrice = p.variants[0]?.price
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group rounded-2xl border bg-card hover:border-[#595B83]/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-square relative bg-gradient-to-br from-[#595B83] to-[#F4ABC4] overflow-hidden">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-12 w-12 text-white/30" />
                  </div>
                )}
                {/* Best seller badge */}
                {p.totalSold >= 10 && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[#F4ABC4] text-[#333456] text-[10px] font-semibold border-0 gap-1 py-0">
                      <Star className="h-2.5 w-2.5 fill-current" /> Terlaris
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                {minPrice && (
                  <p className="text-xs text-primary font-bold mt-1">
                    Mulai {formatPrice(minPrice)}
                  </p>
                )}
                {/* Rating + sold row */}
                <div className="flex items-center justify-between mt-1.5">
                  {p.rating && p.rating.count > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-medium">{p.rating.avg.toFixed(1)}</span>
                      <span className="text-[11px] text-muted-foreground">({p.rating.count})</span>
                    </div>
                  ) : (
                    <span />
                  )}
                  {p.totalSold > 0 && (
                    <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {p.totalSold}+
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
