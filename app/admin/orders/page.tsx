import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status } = await searchParams

  const orders = await db.order.findMany({
    where: status ? { status: status as never } : {},
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  const statuses = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED", "FAILED", "PENDING_STOCK"]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pesanan</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/admin/orders"><Button variant={!status ? "default" : "outline"} size="sm">Semua</Button></Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`}>
            <Button variant={status === s ? "default" : "outline"} size="sm">{s}</Button>
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
            <div>
              <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
              <span className="ml-3 text-sm">{order.customerName}</span>
              <span className="ml-2 text-sm text-muted-foreground">{order.customerEmail}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={order.status === "FULFILLED" ? "default" : "secondary"}>{order.status}</Badge>
              <span className="text-sm font-medium">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
