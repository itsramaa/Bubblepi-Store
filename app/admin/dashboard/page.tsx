import { fetchFromGo, parseJson } from "@/lib/api-client"
import StatsCard from "@/components/admin/StatsCard"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, Download } from "lucide-react"
import BulkFulfillButton from "@/components/admin/BulkFulfillButton"
import RevenueChart from "@/components/admin/RevenueChart"
import type { Order } from "@/types"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  DELIVERED: "Selesai", FAILED: "Gagal", PENDING_STOCK: "Menunggu Stok",
}

const STATUS_CLASS: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  PAID: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  PENDING_STOCK: "bg-orange-100 text-orange-700",
}

interface AdminStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  activeWarranties: number
  lowStockItems: number
}

export default async function AdminDashboard() {
  const [statsRes, ordersRes] = await Promise.all([
    fetchFromGo("/admin/stats"),
    fetchFromGo("/admin/orders?limit=10"),
  ])

  const stats = await parseJson<AdminStats>(statsRes)
  const { orders: recentOrders } = await parseJson<{ orders: Order[]; total: number }>(ordersRes)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Selamat datang di panel admin Bubblepi.</p>
        </div>
        <div className="flex gap-2">
          {stats.pendingOrders > 0 && <BulkFulfillButton pendingCount={stats.pendingOrders} />}
          <a href="/api/admin/orders/export" download>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue Hari Ini"
          value={formatPrice(stats.todayRevenue)}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard title="Total Pesanan" value={stats.todayOrders.toString()} icon={ShoppingBag} />
        <StatsCard
          title="Pesanan Pending"
          value={stats.pendingOrders.toString()}
          icon={Clock}
          variant="default"
        />
        <StatsCard
          title="Stok Kritis"
          value={stats.lowStockItems.toString()}
          subtitle="< 5 unit tersisa"
          icon={AlertTriangle}
          variant={stats.lowStockItems > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
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

        <Card>
          <CardHeader>
            <CardTitle>Top Produk (Revenue)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">Revenue chart tersedia di bawah</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}