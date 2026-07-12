import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Package, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })

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
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada produk</p>
          </div>
        ) : products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/20 transition-colors"
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
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
              <span className="text-sm font-medium">
                Mulai {formatPrice(Math.min(...product.variants.map((v) => v.price)))}
              </span>
              <Link href={`/admin/products/${product.id}`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
