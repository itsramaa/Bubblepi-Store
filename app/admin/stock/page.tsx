import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function AdminStockPage() {
  const variants = await db.variant.findMany({
    include: {
      product: { select: { name: true } },
      stock: true,
    },
    orderBy: { product: { name: "asc" } },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Stok</h1>
      <div className="space-y-2">
        {variants.map((variant) => {
          const available = variant.stock.filter((s) => s.status === "AVAILABLE").length
          const assigned = variant.stock.filter((s) => s.status === "ASSIGNED").length
          const delivered = variant.stock.filter((s) => s.status === "DELIVERED").length
          const isCritical = available < 5

          return (
            <div key={variant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
              <div>
                <p className="font-semibold">{variant.product.name} — {variant.name}</p>
                <p className="text-sm text-muted-foreground">{variant.duration}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isCritical ? "destructive" : "default"}>{available} tersedia</Badge>
                <span className="text-sm text-muted-foreground">{assigned} assigned • {delivered} delivered</span>
                <Link href={`/admin/stock/${variant.id}`}><Button variant="outline" size="sm">Kelola</Button></Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
