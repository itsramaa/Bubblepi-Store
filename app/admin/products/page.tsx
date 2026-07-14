import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Package, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: { variants: { include: { stock: { where: { status: "AVAILABLE" } } } } },
    orderBy: { createdAt: "desc" },
  })

  function totalStock(variants: { stock: unknown[] }[]) {
    return variants.reduce((acc, v) => acc + v.stock.length, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produk</h1>
          <p className="text-muted-foreground mt-1">{products.length} produk terdaftar</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-base font-medium">Belum ada produk</p>
            <p className="text-sm mt-1">Mulai dengan menambahkan produk pertama</p>
          </div>
        ) : products.map((product) => {
          const stock = totalStock(product.variants)
          const stockLabel = stock > 0 ? `${stock} tersedia` : "Habis"
          return (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 bg-card border rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {product.category} • {product.variants.length} varian
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Stock badge */}
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    stock === 0
                      ? "bg-red-100 text-red-700"
                      : stock <= 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {stockLabel}
                </span>
                <span className="text-sm font-medium">
                  Mulai {formatPrice(Math.min(...product.variants.map((v) => v.price)))}
                </span>
                <Link href={`/admin/products/${product.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
