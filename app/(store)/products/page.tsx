import type { Metadata } from "next"
import { fetchFromGo, parseJson } from "@/lib/api-client"
import ProductCard from "@/components/store/ProductCard"
import FilterSidebar from "@/components/store/FilterSidebar"
import { Suspense } from "react"
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton"
import type { ProductDetail } from "@/types"

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
  searchParams: Promise<{
    category?: string
    search?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
  }>
}

// Fetch all active products from Go API — returns raw array without variants
async function getProducts() {
  const res = await fetchFromGo("/products")
  return parseJson<ProductDetail[]>(res)
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
  const products = await getProducts()

  let filtered = products.filter((p) => p.isActive)

  // Filter by category
  if (category) {
    filtered = filtered.filter((p) => p.category === category)
  }

  // Search by name
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    )
  }

  // Client-side sort by name or price approximation
  if (sort === "popular" || sort === "terlaris") {
    // Name-based sort since no sold data available
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (sort === "price_asc" || sort === "price_desc") {
    // No price info from listing endpoint, keep original order
    // Name sort as fallback
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name))
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-lg font-semibold mb-1">Produk tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">
          Coba ubah filter atau kata kunci pencarian kamu
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> produk
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, sort } = await searchParams

  // Fetch all products and extract unique categories
  const products = await getProducts()
  const activeProducts = products.filter((p) => p.isActive)
  const categories = [...new Set(activeProducts.map((p) => p.category).filter((c): c is string => c !== null))].sort()

  const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Semua"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-display-xl">
          {search ? `Hasil: "${search}"` : `${categoryLabel} Produk`}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <FilterSidebar categories={categories} />
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductList
              category={category}
              search={search}
              sort={sort}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}