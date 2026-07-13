import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import ProductCard from "@/components/store/ProductCard"
import type { ProductWithVariants } from "@/types"

export const dynamic = "force-dynamic"

const CATEGORY_EMOJI: Record<string, string> = {
  streaming: "📺",
  ai: "🤖",
  design: "🎨",
  education: "📚",
  gaming: "🎮",
  music: "🎵",
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const products = await db.product.findFirst({ where: { isActive: true, category }, select: { category: true } })
  if (!products) return {}
  return {
    title: `Beli ${category.charAt(0).toUpperCase() + category.slice(1)} Murah - Bubblepi Store`,
    description: `Jual ${category} murah, instant delivery, garansi. Lengkap dengan berbagai pilihan varian.`,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params

  const products = await db.product.findMany({
    where: { isActive: true, category },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })

  // Dari DB: kalau ada produk dengan kategori ini, tampilkan. Kalau nggak, 404.
  if (products.length === 0) notFound()

  const emoji = CATEGORY_EMOJI[category] ?? "📦"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <span className="text-5xl mb-4 block">{emoji}</span>
        <h1 className="text-3xl font-bold capitalize">{category}</h1>
        <p className="text-muted-foreground mt-2">
          Jual {category} murah, instant delivery, garansi
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Belum ada produk di kategori ini.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p as unknown as ProductWithVariants} />)}
        </div>
      )}
    </div>
  )
}
