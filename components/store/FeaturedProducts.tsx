import ProductCard from "./ProductCard"
import type { ProductWithVariants } from "@/types"

interface Props {
  products: ProductWithVariants[]
}

export default function FeaturedProducts({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold mb-8">Produk Unggulan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
