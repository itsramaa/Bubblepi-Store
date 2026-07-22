import { fetchFromGo, parseJson } from "@/lib/api-client"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { TrendingUp, Clock, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

interface DashboardStats {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  pendingCount: number
  lowStockVariants: { id: string; name: string; available: number }[]
}

export default async function DashboardMetrics() {
  const res = await fetchFromGo("/admin/stats")
  const stats = await parseJson<DashboardStats>(res)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-hairline rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm text-muted">Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <p className="text-display-sm font-bold">{formatPrice(stats.todayRevenue)}</p>
            <p className="text-caption-sm text-muted mt-1">Revenue hari ini</p>
          </CardContent>
        </Card>

        <Card className="border border-hairline rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm text-muted">Minggu Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <p className="text-display-sm font-bold">{formatPrice(stats.weekRevenue)}</p>
            <p className="text-caption-sm text-muted mt-1">Revenue minggu ini</p>
          </CardContent>
        </Card>

        <Card className="border border-hairline rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm text-muted">Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <p className="text-display-sm font-bold">{formatPrice(stats.monthRevenue)}</p>
            <p className="text-caption-sm text-muted mt-1">Revenue bulan ini</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-hairline rounded-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-body-sm text-muted">Pesanan Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted" />
        </CardHeader>
        <CardContent>
          <p className="text-display-sm font-bold">{stats.pendingCount}</p>
          <Link href="/admin/orders" className="text-caption-sm text-primary hover:underline mt-1 block">
            Lihat semua pesanan →
          </Link>
        </CardContent>
      </Card>

      {stats.lowStockVariants && stats.lowStockVariants.length > 0 && (
        <Card className="border border-hairline rounded-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-body-sm">Stok Kritis (&lt; 3 tersisa)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.lowStockVariants.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-body-sm">
                  <Link
                    href={`/admin/stock/${v.id}`}
                    className="hover:underline text-ink truncate max-w-[70%]"
                  >
                    {v.name}
                  </Link>
                  <span className={`text-badge inline-flex items-center rounded-full px-2.5 py-0.5 border border-hairline ${
                    v.available === 0 ? "bg-destructive/10 text-destructive" : "bg-surface-soft text-muted"
                  }`}>
                    {v.available} tersisa
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}