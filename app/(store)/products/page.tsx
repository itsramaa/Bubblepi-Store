import { db } from "@/lib/db"
import ProductCard from "@/components/store/ProductCard"
import FilterSidebar from "@/components/store/FilterSidebar"
import type { ProductWithVariants } from "@/types"

export const dynamic = "force-dynamic"

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search } = await searchParams

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

  const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Semua"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">
          {search ? `Hasil: "${search}"` : `${categoryLabel} Produk`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {products.length} produk ditemukan
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar />
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg text-muted-foreground">Produk tidak ditemukan</p>
              <p className="text-sm text-muted-foreground mt-1">Coba kata kunci lain atau kategori berbeda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as unknown as ProductWithVariants} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
