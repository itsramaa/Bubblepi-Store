import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Produk</h1>
        <Link href="/admin/products/new"><Button>+ Tambah Produk</Button></Link>
      </div>
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
            <div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.variants.length} varian • {product.category}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? "Aktif" : "Nonaktif"}</Badge>
              <span className="text-sm">Mulai {formatPrice(Math.min(...product.variants.map((v) => v.price)))}</span>
              <Link href={`/admin/products/${product.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
