import { db } from "@/lib/db"
import type { Metadata } from "next"
import ProductCard from "@/components/store/ProductCard"
import FilterSidebar from "@/components/store/FilterSidebar"
import type { ProductWithVariants } from "@/types"
import { Suspense } from "react"
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Produk Digital Murah - Bubblepi Store",
  description: "Beli akun streaming, AI tools, dan software premium dengan harga terjangkau. Instant delivery, bergaransi.",
  openGraph: {
    title: "Produk Digital Murah - Bubblepi Store",
    description: "Akun streaming & software premium, harga terjangkau, instant delivery.",
    url: "https://bubblepi-store.vercel.app/products",
    siteName: "Bubblepi Store",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}

async function ProductList({
  category,
  search,
  sort,
}: {
  category?: string
  search?: string
  sort?: string
}) {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })

  // Attach sold count per product
  const soldCounts = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { order: { status: "FULFILLED" } },
    _sum: { quantity: true },
  })
  const variantSoldMap = new Map(soldCounts.map((s) => [s.variantId, s._sum.quantity ?? 0]))

  // Attach stock count per product
  const allVariantIds = products.flatMap((p) => p.variants.map((v) => v.id))
  const stockCounts = await db.accountStock.groupBy({
    by: ["variantId"],
    where: { variantId: { in: allVariantIds }, status: "AVAILABLE" },
    _count: { id: true },
  })
  const stockMap = new Map(stockCounts.map((s) => [s.variantId, s._count.id]))

  // Attach average rating + review count per product
  const productIds = products.map((p) => p.id)
  const ratingData = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const ratingMap = new Map(ratingData.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count.rating }]))

  let productsWithMeta = products.map((p) => {
    const rating = ratingMap.get(p.id)
    return {
      ...p,
      totalSold: p.variants.reduce((acc, v) => acc + (variantSoldMap.get(v.id) ?? 0), 0),
      totalStock: p.variants.reduce((acc, v) => acc + (stockMap.get(v.id) ?? 0), 0),
      avgRating: rating ? Math.round(rating.avg * 10) / 10 : undefined,
      reviewCount: rating?.count ?? 0,
    }
  })

  // Sort by popular (most sold) post-query since Prisma can't order by computed field
  if (sort === "popular") {
    productsWithMeta = productsWithMeta.sort((a, b) => b.totalSold - a.totalSold)
  }

  // Sort by price using minimum variant price
  if (sort === "price_asc" || sort === "price_desc") {
    productsWithMeta = productsWithMeta.sort((a, b) => {
      const minA = Math.min(...a.variants.map((v) => v.price), Infinity)
      const minB = Math.min(...b.variants.map((v) => v.price), Infinity)
      return sort === "price_asc" ? minA - minB : minB - minA
    })
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-lg text-muted-foreground">Produk tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {productsWithMeta.map((product) => (
        <ProductCard key={product.id} product={product as unknown as ProductWithVariants} />
      ))}
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, sort } = await searchParams

  // Fetch distinct categories from DB for dynamic filter
  const categoryRows = await db.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  })
  const categories = categoryRows.map((r) => r.category)

  const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Semua"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">
          {search ? `Hasil: "${search}"` : `${categoryLabel} Produk`}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar categories={categories} />
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductList category={category} search={search} sort={sort} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
