import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Tv, Bot, Palette, BookOpen, Gamepad2, Globe } from "lucide-react"

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
    take: 4,
    orderBy: { createdAt: "desc" },
  })

  if (related.length === 0) return null

  const Icon = ICONS[category] ?? Globe

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold mb-6">Produk Serupa</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((p) => {
          const minPrice = p.variants[0]?.price
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group rounded-2xl border bg-card hover:border-[#595B83]/40 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="aspect-square relative bg-gradient-to-br from-[#595B83] to-[#F4ABC4]">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-12 w-12 text-white/30" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                {minPrice && (
                  <p className="text-xs text-primary font-bold mt-1">
                    Mulai {formatPrice(minPrice)}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
