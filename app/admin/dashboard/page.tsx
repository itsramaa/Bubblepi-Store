import { db } from "@/lib/db"
import StatsCard from "@/components/admin/StatsCard"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TrendingUp, ShoppingBag, Clock, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Menunggu Bayar",
  PAID: "Dibayar",
  FULFILLED: "Selesai",
  FAILED: "Gagal",
  PENDING_STOCK: "Menunggu Stok",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FULFILLED: "default",
  PAID: "secondary",
  PENDING: "outline",
  AWAITING_PAYMENT: "outline",
  FAILED: "destructive",
  PENDING_STOCK: "destructive",
}

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
    db.variant
      .findMany({ include: { stock: { where: { status: "AVAILABLE" } } } })
      .then((variants) => variants.filter((v) => v.stock.length < 5).length),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Selamat datang di panel admin Bubblepi.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue Hari Ini"
          value={formatPrice(revenueToday._sum.total ?? 0)}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Total Pesanan"
          value={totalOrders.toString()}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Pesanan Pending"
          value={pendingOrders.toString()}
          icon={Clock}
          variant={pendingOrders > 0 ? "default" : "default"}
        />
        <StatsCard
          title="Stok Kritis"
          value={criticalStock.toString()}
          subtitle="< 5 unit tersisa"
          icon={AlertTriangle}
          variant={criticalStock > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pesanan Terbaru</CardTitle>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">Lihat Semua</Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-mono">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[order.status] ?? "outline"} className="text-xs">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                  <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
