import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { parseDurationDays } from "@/lib/duration"
import VariantCompareTable from "@/components/store/VariantCompareTable"
import ReviewSection from "@/components/store/ReviewSection"
import CredentialPreview from "@/components/store/CredentialPreview"
import RelatedProducts from "@/components/store/RelatedProducts"
import PriceDropNotify from "@/components/store/PriceDropNotify"
import { StockBadge } from "@/components/product/stock-badge"
import { ProductViewTracker } from "@/components/store/ProductViewTracker"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import {
  Shield, Zap, MessageCircle, ChevronRight, Star, Users,
  Tv, Bot, Palette, BookOpen, Gamepad2, Globe, Lock, CheckCircle2,
} from "lucide-react"

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

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ElementType> = {
    streaming: Tv, ai: Bot, design: Palette, education: BookOpen, gaming: Gamepad2,
  }
  return icons[category] ?? Globe
}

function getCategoryGradient(category: string) {
  const gradients: Record<string, string> = {
    streaming: "from-red-500 to-rose-600",
    ai: "from-emerald-500 to-teal-600",
    design: "from-violet-500 to-purple-600",
    education: "from-amber-500 to-orange-600",
    gaming: "from-blue-500 to-indigo-600",
  }
  return gradients[category] ?? "from-[#595B83] to-[#F4ABC4]"
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await db.product.findUnique({ where: { slug }, include: { variants: true } })
  if (!product) notFound()

  const variantIds = product.variants.map((v) => v.id)

  // Single query — ganti N+1 per-variant count
  const stockCounts = await db.accountStock.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, status: "AVAILABLE" },
    _count: { id: true },
  })
  const stockMap = new Map(stockCounts.map((s) => [s.variantId, s._count.id]))

  const variantsWithStock = product.variants.map((v) => ({
    ...v,
    stockCount: stockMap.get(v.id) ?? 0,
  }))

  const soldData = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { variantId: { in: product.variants.map((v) => v.id) }, order: { status: "FULFILLED" } },
    _sum: { quantity: true },
  })
  const soldMap = new Map(soldData.map((s) => [s.variantId, s._sum.quantity ?? 0]))
  const totalSold = soldData.reduce((a, s) => a + (s._sum.quantity ?? 0), 0)

  const withPpd = variantsWithStock.map((v) => ({
    ...v,
    pricePerDay: Math.round(v.price / parseDurationDays(v.duration)),
  }))
  const minPpd = Math.min(...withPpd.map((v) => v.pricePerDay))
  const bestValueId = withPpd.length > 1 ? withPpd.find((v) => v.pricePerDay === minPpd)?.id : undefined

  const minPrice = Math.min(...product.variants.map((v) => v.price))
  const maxPrice = Math.max(...product.variants.map((v) => v.price))
  const totalStock = variantsWithStock.reduce((a, v) => a + v.stockCount, 0)

  const reviews = await db.review.findMany({
    where: { productId: product.id, isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { order: { select: { customerName: true } } },
  })
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  const CategoryIcon = getCategoryIcon(product.category)
  const gradient = getCategoryGradient(product.category)

  const productUrl = `https://bubblepi-store.vercel.app/products/${product.slug}`
  const imageUrl = product.image?.startsWith("http")
    ? product.image
    : product.image
      ? `https://bubblepi-store.vercel.app${product.image}`
      : undefined

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://bubblepi-store.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Produk", item: "https://bubblepi-store.vercel.app/products" },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  }

  // JSON-LD: Product
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: productUrl,
    ...(imageUrl && { image: imageUrl }),
    ...(avgRating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      "@type": "AggregateOffer",
      lowPrice: minPrice,
      highPrice: maxPrice,
      priceCurrency: "IDR",
      availability: totalStock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <ProductViewTracker productId={product.id} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Beranda</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-foreground transition-colors">Produk</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Left — Image */}
        <div className="space-y-4">
          {/* Image with zoom on hover */}
          <div className={`group relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br ${gradient}`}>
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <CategoryIcon className="h-32 w-32 text-white/30" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 gap-1.5">
                <CategoryIcon className="h-3 w-3" />
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </Badge>
            </div>
            {totalSold > 0 && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 gap-1.5">
                  <Users className="h-3 w-3" />
                  {totalSold}+ terjual
                </Badge>
              </div>
            )}
          </div>

          {/* Trust badges — 4 items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Zap, label: "Instan", sub: "< 5 menit", color: "text-amber-500" },
              { icon: Shield, label: "Garansi", sub: product.variants.some(v => v.hasWarranty) ? "Garansi resmi" : "Terpercaya", color: "text-green-500" },
              { icon: CheckCircle2, label: "Aman", sub: "100% legit", color: "text-blue-500" },
              { icon: MessageCircle, label: "Support 24/7", sub: "Via WhatsApp", color: "text-[#595B83]" },
            ].map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl border bg-muted/30 gap-1">
                <Icon className={`h-5 w-5 ${color}`} />
                <p className="text-xs font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* Credential preview */}
          <CredentialPreview type={product.category} />
        </div>

        {/* Right — Info */}
        <div className="space-y-6">
          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="gap-1">
                {product.type === "private" ? <Lock className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                {product.type === "private" ? "Private" : "Sharing"}
              </Badge>
              {reviews.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)} ({reviews.length} ulasan)
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{product.name}</h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">{product.description}</p>
          </div>

          {/* Price range */}
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Mulai dari</span>
            <span className="text-3xl font-bold text-primary">{formatPrice(minPrice)}</span>
            {maxPrice !== minPrice && (
              <span className="text-muted-foreground text-sm">— {formatPrice(maxPrice)}</span>
            )}
          </div>

          {/* Per-variant stock badges */}
          {variantsWithStock.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {variantsWithStock.map((v) => {
                const badge = <StockBadge key={v.id} availableStock={v.stockCount} />
                if (!badge) return null
                return (
                  <div key={v.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">{v.name}:</span>
                    <StockBadge availableStock={v.stockCount} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Stock warning */}
          {totalStock === 0 && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              Stok habis — coba lagi nanti atau hubungi admin.
            </div>
          )}
          {totalStock > 0 && totalStock <= 5 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm font-medium">
              ⚠️ Stok terbatas! Sisa {totalStock} unit tersedia.
            </div>
          )}

          {/* Variant selector — anchor for sticky CTA observer */}
          <div id="variant-selector-anchor">
            <VariantCompareTable
              variants={withPpd}
              product={{ id: product.id, name: product.name }}
              bestValueId={bestValueId}
              soldMap={Object.fromEntries(soldMap)}
            />
          </div>

          {/* Price drop notification — only show when product is in stock */}
          {totalStock > 0 && (() => {
            const cheapestVariant = withPpd.reduce((a, b) => a.price <= b.price ? a : b)
            return (
              <PriceDropNotify
                variantId={cheapestVariant.id}
                currentPrice={cheapestVariant.price}
              />
            )
          })()}

          {/* Why buy here — 4 trust points */}
          <div className="p-5 rounded-2xl bg-muted/30 border space-y-2.5">
            <p className="font-semibold text-sm">Mengapa beli di sini?</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { icon: Zap, color: "text-amber-500", text: "Akun dikirim otomatis ke email dalam hitungan menit" },
                { icon: Shield, color: "text-green-500", text: "Garansi penggantian jika ada masalah" },
                { icon: CheckCircle2, color: "text-blue-500", text: "Transaksi aman & terenkripsi — 100% terpercaya" },
                { icon: MessageCircle, color: "text-[#595B83]", text: `Support 24/7 via WhatsApp — ${totalSold > 0 ? `${totalSold}+` : "ratusan"} pembeli sudah puas` },
              ].map(({ icon: Icon, color, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${color} shrink-0`} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* WA Support */}
          <a
            href="https://wa.me/6285179955480"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-green-500" />
            Ada pertanyaan? Chat admin via WhatsApp
          </a>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <ReviewSection productId={product.id} reviews={reviews as any} avgRating={avgRating} />
      </div>

      {/* Related products — wrapped in Suspense for streaming */}
      <Suspense fallback={
        <div className="mt-16">
          <div className="h-7 w-40 bg-muted animate-pulse rounded-md mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <RelatedProducts productId={product.id} category={product.category} />
      </Suspense>
    </div>
  )
}
