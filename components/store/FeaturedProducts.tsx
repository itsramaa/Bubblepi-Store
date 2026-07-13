import Link from "next/link"
import ProductCard from "./ProductCard"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
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
          <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">Pilihan Terbaik</p>
          <h2 className="text-3xl md:text-4xl font-bold">Produk Unggulan</h2>
          <p className="text-muted-foreground mt-2">Paling laris dan paling direkomendasikan</p>
        </div>
        <Link href="/products">
          <Button variant="ghost" className="gap-2 hidden sm:flex">
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
