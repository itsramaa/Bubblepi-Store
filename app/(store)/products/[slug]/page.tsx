import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import AddToCartButton from "@/components/store/AddToCartButton"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params

  const product = await db.product.findUnique({
    where: { slug },
    include: { variants: true },
  })

  if (!product) notFound()

  const minPrice = Math.min(...product.variants.map((v) => v.price))
  const maxPrice = Math.max(...product.variants.map((v) => v.price))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/products" className="hover:text-foreground transition-colors">Produk</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl opacity-30">{getCategoryEmoji(product.category)}</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 text-foreground backdrop-blur-sm border-0 text-sm px-3 py-1">
              {product.category}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(minPrice)}
            </span>
            {maxPrice !== minPrice && (
              <span className="text-muted-foreground">— {formatPrice(maxPrice)}</span>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Pilih Varian:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.variants.map((variant) => (
                <AddToCartButton
                  key={variant.id}
                  variant={variant}
                  product={{ id: product.id, name: product.name }}
                />
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-10 p-5 rounded-xl bg-muted/50 border">
            <h3 className="font-semibold text-sm mb-3">Kenapa beli di Bubblepi?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">⚡ Instant delivery — akun dikirim otomatis ke email</li>
              <li className="flex items-center gap-2">🔒 Aman & terpercaya — sudah 1000+ pelanggan</li>
              <li className="flex items-center gap-2">💬 Support cepat via DM</li>
            </ul>
          </div>
        </div>
      </div>
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
