import Link from "next/link"
import { Suspense } from "react"
import ProductCard from "./ProductCard"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { ProductWithVariants } from "@/types"

interface Props {
  products: (ProductWithVariants & { totalSold?: number })[]
  totalStoreSold?: number
}

function FeaturedProductsSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-property border border-hairline overflow-hidden">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-7 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturedProductsContent({ products, totalStoreSold }: Props) {
  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-body-sm font-medium text-primary mb-1 uppercase tracking-wider">🔥 Produk Terlaris</p>
          <h2 className="text-display-xl">Paling Laris</h2>
          <p className="text-body-md text-muted mt-2">
            {totalStoreSavedDisplay(totalStoreSold)} produk paling laris bulan ini
          </p>
        </div>
        <Link href="/products">
          <Button variant="ghost" className="gap-2 hidden sm:flex text-link hover:text-ink">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Link href="/products">
          <Button variant="outline" className="gap-2">
            Lihat Semua Produk <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

function totalStoreSavedDisplay(total?: number): string {
  if (!total || total < 1000) return "Ratusan"
  if (total < 10000) return `${Math.floor(total / 1000)}rb+`
  return `${Math.floor(total / 1000)}.000+`
}

export default function FeaturedProducts(props: Props) {
  return (
    <Suspense fallback={<FeaturedProductsSkeleton />}>
      <FeaturedProductsContent {...props} />
    </Suspense>
  )
}