import { fetchFromGo, parseJson } from "@/lib/api-client"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Tv, Bot, Palette, BookOpen, Gamepad2, Globe, Star, Users } from "lucide-react"
import type { Product } from "@/types"

interface Props {
  productId: string
  category: string
}

interface RelatedProduct extends Product {
  variants: { id: string; price: number }[]
  totalSold: number
  avgRating: number
  reviewCount: number
}

const ICONS: Record<string, React.ElementType> = {
  streaming: Tv, ai: Bot, design: Palette, education: BookOpen, gaming: Gamepad2,
}

export default async function RelatedProducts({ productId, category }: Props) {
  let sorted: RelatedProduct[] = []
  try {
    const res = await fetchFromGo(`/products?category=${encodeURIComponent(category)}`)
    const all = await parseJson<RelatedProduct[]>(res)
    sorted = all
      .filter((p) => p.id !== productId && p.isActive)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 4)
  } catch {
    return null
  }

  if (sorted.length === 0) return null

  const Icon = ICONS[category] ?? Globe

  return (
    <div className="mt-16">
      <h2 className="text-title-md mb-6">Produk Serupa</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sorted.map((p) => {
          const minPrice = p.variants[0]?.price
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group card-property border border-hairline hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-square relative bg-gradient-to-br from-[#595B83] to-[#F4ABC4] overflow-hidden">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-12 w-12 text-white/30" />
                  </div>
                )}
                {p.totalSold >= 10 && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-canvas text-ink text-[11px] font-semibold px-2.5 py-0.5 shadow-sm border border-hairline">
                      <Star className="h-2.5 w-2.5 fill-current" /> Terlaris
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-title-sm line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                {minPrice && (
                  <p className="text-body-sm text-primary font-bold mt-1">
                    Mulai {formatPrice(minPrice)}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  {p.avgRating > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-star-rating text-star-rating" />
                      <span className="text-[11px] font-medium">{p.avgRating.toFixed(1)}</span>
                      <span className="text-[11px] text-muted">({p.reviewCount})</span>
                    </div>
                  ) : (
                    <span />
                  )}
                  {p.totalSold > 0 && (
                    <div className="flex items-center gap-0.5 text-[11px] text-muted">
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