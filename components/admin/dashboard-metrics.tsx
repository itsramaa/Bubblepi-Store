import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TrendingUp, Clock, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardMetrics() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [todayRevenue, weekRevenue, monthRevenue, pendingCount] = await Promise.all([
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: todayStart }, status: "FULFILLED" } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: weekStart }, status: "FULFILLED" } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: monthStart }, status: "FULFILLED" } }),
    db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PENDING_STOCK"] } } }),
  ])

  const lowStockVariants = await db.$queryRaw<Array<{ id: string; name: string; available: bigint }>>`
    SELECT v.id, v.name, COUNT(as_.id) as available
    FROM "Variant" v
    LEFT JOIN "AccountStock" as_ ON as_."variantId" = v.id AND as_.status = 'AVAILABLE'
    GROUP BY v.id, v.name
    HAVING COUNT(as_.id) < 3
    ORDER BY available ASC
    LIMIT 20
  `

  const lowStock = lowStockVariants.map((v) => ({ ...v, available: Number(v.available) }))

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(todayRevenue._sum.total ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Minggu Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(weekRevenue._sum.total ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue minggu ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(monthRevenue._sum.total ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pesanan Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{pendingCount}</p>
          <Link href="/admin/orders" className="text-xs text-primary hover:underline mt-1 block">
            Lihat semua pesanan →
          </Link>
        </CardContent>
      </Card>

      {/* Low Stock Variants */}
      {lowStock.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm font-medium">Stok Kritis (&lt; 3 tersisa)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/admin/stock/${v.id}`}
                    className="hover:underline text-foreground truncate max-w-[70%]"
                  >
                    {v.name}
                  </Link>
                  <Badge variant={v.available === 0 ? "destructive" : "outline"}>
                    {v.available} tersisa
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
