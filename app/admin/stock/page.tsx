import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Archive, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { searchParams: Promise<{ search?: string }> }

export default async function AdminStockPage({ searchParams }: Props) {
  const { search } = await searchParams

  const variants = await db.variant.findMany({
    where: search ? {
      OR: [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    } : undefined,
    include: {
      product: { select: { name: true } },
      stock: true,
    },
    orderBy: { product: { name: "asc" } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stok</h1>
        <p className="text-muted-foreground mt-1">Kelola credentials per varian produk</p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <Input
          name="search"
          placeholder="Cari produk atau varian..."
          defaultValue={search ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" size="sm">Cari</Button>
      </form>

      <div className="space-y-2">
        {variants.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Tidak ada varian ditemukan</p>
          </div>
        ) : variants.map((variant) => {
          const available = variant.stock.filter((s) => s.status === "AVAILABLE").length
          const assigned = variant.stock.filter((s) => s.status === "ASSIGNED").length
          const isCritical = available < 5

          return (
            <div
              key={variant.id}
              className={`flex items-center justify-between p-4 bg-card border rounded-xl transition-colors hover:border-primary/20 ${isCritical ? "border-destructive/30" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {isCritical
                    ? <AlertTriangle className="h-5 w-5 text-destructive" />
                    : <Archive className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold">{variant.product.name} — {variant.name}</p>
                  <p className="text-sm text-muted-foreground">{variant.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right text-sm hidden sm:block">
                  <p className="text-muted-foreground">{assigned} assigned</p>
                  <p className="text-muted-foreground">{variant.stock.length} total</p>
                </div>
                <Badge variant={isCritical ? "destructive" : "default"}>
                  {available} tersedia
                </Badge>
                <Link href={`/admin/stock/${variant.id}`}>
                  <Button variant="outline" size="sm">Kelola</Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
