import { fetchFromGo, parseJson } from "@/lib/api-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Archive, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

interface StockVariant {
  id: string
  name: string
  productName: string
  available: number
  assigned: number
  total: number
}

interface Props { searchParams: Promise<{ search?: string }> }

export default async function AdminStockPage({ searchParams }: Props) {
  const { search } = await searchParams

  const params = new URLSearchParams()
  if (search) params.set("search", search)

  const res = await fetchFromGo(`/admin/stock?${params.toString()}`)
  const variants = await parseJson<StockVariant[]>(res)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stok</h1>
        <p className="text-muted-foreground mt-1">Kelola credentials per varian produk</p>
      </div>

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
          const isCritical = variant.available < 5
          const stockColor =
            variant.available === 0
              ? "bg-red-100 text-red-700"
              : variant.available < 5
              ? "bg-red-100 text-red-700"
              : variant.available < 10
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"

          return (
            <div
              key={variant.id}
              className={`flex items-center justify-between p-4 bg-card border rounded-xl transition-colors hover:border-primary/20 ${isCritical ? "border-destructive/30" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {isCritical
                    ? <AlertTriangle className="h-5 w-5 text-destructive" />
                    : <Archive className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{variant.productName} — {variant.name}</p>
                  <p className="text-sm text-muted-foreground">{variant.name}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center shrink-0 ml-3">
                <div className="text-right text-sm hidden sm:block">
                  <p className="text-muted-foreground">{variant.assigned} assigned</p>
                  <p className="text-muted-foreground">{variant.total} total</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stockColor}`}>
                  {variant.available} tersedia
                </span>
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