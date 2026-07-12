import { db } from "@/lib/db"
import StatsCard from "@/components/admin/StatsCard"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AdminDashboard() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [revenueToday, totalOrders, pendingOrders, criticalStock, recentOrders] = await Promise.all([
    db.order.aggregate({
      where: { status: "FULFILLED", paidAt: { gte: today } },
      _sum: { total: true },
    }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PAID"] } } }),
    db.variant.findMany({
      include: { stock: { where: { status: "AVAILABLE" } } },
    }).then((variants) => variants.filter((v) => v.stock.length < 5).length),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Revenue Hari Ini" value={formatPrice(revenueToday._sum.total ?? 0)} />
        <StatsCard title="Total Pesanan" value={totalOrders.toString()} />
        <StatsCard title="Pesanan Pending" value={pendingOrders.toString()} />
        <StatsCard title="Stok Kritis" value={criticalStock.toString()} variant="destructive" />
      </div>

      <Card>
        <CardHeader><CardTitle>Pesanan Terbaru</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <div>
                  <span className="font-mono text-sm">{order.orderNumber}</span>
                  <span className="ml-2 text-muted-foreground text-sm">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "FULFILLED" ? "default" : "secondary"}>{order.status}</Badge>
                  <span className="text-sm">{formatPrice(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
