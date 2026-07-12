import ProductCard from "./ProductCard"
import type { ProductWithVariants } from "@/types"

interface Props {
  products: ProductWithVariants[]
}

export default function FeaturedProducts({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Produk Unggulan</h2>
          <p className="text-muted-foreground mt-2">Paling laris dan recommended</p>
        </div>
        <a href="/products" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Lihat Semua
          <span className="text-lg">→</span>
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-8 text-center sm:hidden">
        <a href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Lihat Semua Produk →
        </a>
      </div>
    </section>
  )
}
