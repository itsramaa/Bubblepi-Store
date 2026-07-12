import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  FULFILLED: "Selesai", FAILED: "Gagal", PENDING_STOCK: "Menunggu Stok",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FULFILLED: "default", PAID: "secondary", PENDING: "outline",
  AWAITING_PAYMENT: "outline", FAILED: "destructive", PENDING_STOCK: "destructive",
}
const STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED", "FAILED", "PENDING_STOCK"]

interface Props { searchParams: Promise<{ status?: string; page?: string; search?: string }> }

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, page: pageStr, search } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    db.order.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(params: Record<string, string | undefined>) {
    const q = new URLSearchParams()
    if (params.status) q.set("status", params.status)
    if (params.search) q.set("search", params.search)
    if (params.page && params.page !== "1") q.set("page", params.page)
    const qs = q.toString()
    return `/admin/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pesanan</h1>
        <p className="text-muted-foreground mt-1">{total} pesanan ditemukan</p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <Input
          name="search"
          placeholder="Cari order#, nama, atau email..."
          defaultValue={search ?? ""}
          className="max-w-sm"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" size="sm">Cari</Button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link href={buildUrl({ search })}>
          <Badge variant={!status ? "default" : "outline"} className="cursor-pointer px-3 py-1 text-sm">
            Semua
          </Badge>
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={buildUrl({ status: s, search })}>
            <Badge variant={status === s ? "default" : "outline"} className="cursor-pointer px-3 py-1 text-sm">
              {STATUS_LABEL[s]}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Tidak ada pesanan</p>
          </div>
        ) : orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{order.customerName} • {order.customerEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={STATUS_VARIANT[order.status] ?? "outline"} className="text-xs">
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
              <span className="text-sm font-bold">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link href={buildUrl({ status, search, page: String(page - 1) })}>
            <Button variant="outline" size="sm" disabled={page <= 1}>Sebelumnya</Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Link href={buildUrl({ status, search, page: String(page + 1) })}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>Berikutnya</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
