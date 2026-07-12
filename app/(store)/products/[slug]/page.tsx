import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { parseDurationDays } from "@/lib/duration"
import AddToCartButton from "@/components/store/AddToCartButton"
import VariantCompareTable from "@/components/store/VariantCompareTable"
import ReviewSection from "@/components/store/ReviewSection"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, description: true, image: true } })
  if (!product) return {}
  const title = `Beli ${product.name} Murah - Bubblepi Store`
  const desc = product.description.slice(0, 160)
  const imageUrl = product.image?.startsWith("http") ? product.image : `https://bubblepi-store.vercel.app${product.image}`
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url: `https://bubblepi-store.vercel.app/products/${slug}`, siteName: "Bubblepi Store", images: [{ url: imageUrl }], type: "website" },
    twitter: { card: "summary_large_image", title, description: desc, images: [imageUrl] },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await db.product.findUnique({ where: { slug }, include: { variants: true } })
  if (!product) notFound()

  const variantsWithStock = await Promise.all(
    product.variants.map(async (v) => ({
      ...v,
      stockCount: await db.accountStock.count({ where: { variantId: v.id, status: "AVAILABLE" } }),
    }))
  )

  // sold count
  const soldData = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { variantId: { in: product.variants.map((v) => v.id) }, order: { status: "FULFILLED" } },
    _sum: { quantity: true },
  })
  const soldMap = new Map(soldData.map((s) => [s.variantId, s._sum.quantity ?? 0]))
  const totalSold = soldData.reduce((a, s) => a + (s._sum.quantity ?? 0), 0)

  // best value variant (lowest price/day)
  const withPpd = variantsWithStock.map((v) => ({ ...v, pricePerDay: Math.round(v.price / parseDurationDays(v.duration)) }))
  const minPpd = Math.min(...withPpd.map((v) => v.pricePerDay))
  const bestValueId = withPpd.length > 1 ? withPpd.find((v) => v.pricePerDay === minPpd)?.id : undefined

  const minPrice = Math.min(...product.variants.map((v) => v.price))
  const maxPrice = Math.max(...product.variants.map((v) => v.price))
  const totalStock = variantsWithStock.reduce((a, v) => a + v.stockCount, 0)

  // reviews
  const reviews = await db.review.findMany({ where: { productId: product.id, isVisible: true }, orderBy: { createdAt: "desc" }, take: 20 })
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/products" className="hover:text-foreground transition-colors">Produk</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl opacity-30">{getCategoryEmoji(product.category)}</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 text-foreground backdrop-blur-sm border-0 text-sm px-3 py-1">{product.category}</Badge>
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline">{product.type === "private" ? "🔑 Private" : "🔗 Sharing"}</Badge>
            <Badge variant="outline">{product.category}</Badge>
            {totalSold > 0 && <Badge variant="secondary">🔥 {totalSold} terjual</Badge>}
            {reviews.length > 0 && <Badge variant="secondary">⭐ {avgRating.toFixed(1)} ({reviews.length} ulasan)</Badge>}
          </div>

          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{formatPrice(minPrice)}</span>
            {maxPrice !== minPrice && <span className="text-muted-foreground">— {formatPrice(maxPrice)}</span>}
          </div>

          {/* Urgency banner */}
          {totalStock === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
              ⚠️ Stok habis — coba lagi nanti
            </div>
          )}
          {totalStock > 0 && totalStock <= 5 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium">
              ⚡ Stok terbatas! Sisa {totalStock} unit tersedia
            </div>
          )}

          <div className="mt-8">
            <VariantCompareTable variants={withPpd} product={{ id: product.id, name: product.name }} bestValueId={bestValueId} soldMap={Object.fromEntries(soldMap)} />
          </div>

          <div className="mt-10 p-5 rounded-xl bg-muted/50 border">
            <h3 className="font-semibold text-sm mb-3">Kenapa beli di Bubblepi?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">⚡ Instant delivery — akun dikirim otomatis ke email</li>
              <li className="flex items-center gap-2">🔒 Aman & terpercaya — sudah {totalSold > 0 ? `${totalSold}+` : "banyak"} pembeli</li>
              <li className="flex items-center gap-2">💬 Support cepat via WhatsApp</li>
            </ul>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} reviews={reviews} avgRating={avgRating} />
    </div>
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
