import { db } from "@/lib/db"
import StatsCard from "@/components/admin/StatsCard"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, Download } from "lucide-react"
import BulkFulfillButton from "@/components/admin/BulkFulfillButton"
import RevenueChart from "@/components/admin/RevenueChart"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  DELIVERED: "Selesai", FAILED: "Gagal", PENDING_STOCK: "Menunggu Stok",
}

// Color-coded classes per status
const STATUS_CLASS: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  PAID: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  PENDING_STOCK: "bg-orange-100 text-orange-700",
}

export default async function AdminDashboard() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [revenueToday, totalOrders, pendingOrders, pendingStock, criticalStock, recentOrders, revenueByProduct] = await Promise.all([
    db.order.aggregate({
      where: { status: "DELIVERED", paidAt: { gte: today } },
      _sum: { total: true },
    }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PAID"] } } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.variant
      .findMany({ include: { stocks: { where: { status: "AVAILABLE" } } } })
      .then((variants) => variants.filter((v) => v.stocks.length < 5).length),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Revenue per produk (fulfilled orders, all time)
    db.orderItem.groupBy({
      by: ["variantId"],
      where: { order: { status: "DELIVERED" } },
      _sum: { price: true },
      _count: { id: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),
  ])

  // Enrich revenue by product with variant + product name
  const variantIds = revenueByProduct.map((r) => r.variantId)
  const variants = await db.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true } } },
  })
  const variantMap = Object.fromEntries(variants.map((v) => [v.id, v]))

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Selamat datang di panel admin Bubblepi.</p>
        </div>
        <div className="flex gap-2">
          {pendingStock > 0 && <BulkFulfillButton pendingCount={pendingStock} />}
          <a href="/api/admin/orders/export" download>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue Hari Ini"
          value={formatPrice(revenueToday._sum.total ?? 0)}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard title="Total Pesanan" value={totalOrders.toString()} icon={ShoppingBag} />
        <StatsCard
          title="Pesanan Pending"
          value={pendingOrders.toString()}
          icon={Clock}
          variant="default"
        />
        <StatsCard
          title="Stok Kritis"
          value={criticalStock.toString()}
          subtitle="< 5 unit tersisa"
          icon={AlertTriangle}
          variant={criticalStock > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        {/* Pesanan terbaru */}
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
                      <p className="text-xs text-muted-foreground">{order.guestName ?? "Member"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue per produk */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produk (Revenue)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByProduct.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {revenueByProduct.map((r) => {
                  const v = variantMap[r.variantId]
                  if (!v) return null
                  const revenue = r._sum.price ?? 0
                  const maxRevenue = (revenueByProduct[0]._sum.price ?? 1)
                  const pct = Math.round((revenue / maxRevenue) * 100)
                  return (
                    <div key={r.variantId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{v.product.name} — {v.name}</span>
                        <span className="text-muted-foreground">{formatPrice(revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{r._count.id} item terjual</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
