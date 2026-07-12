"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  FULFILLED: "Selesai", FAILED: "Gagal", PENDING_STOCK: "Menunggu Stok",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FULFILLED: "default", PAID: "secondary", PENDING: "outline",
  AWAITING_PAYMENT: "outline", FAILED: "destructive", PENDING_STOCK: "destructive",
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfilled, setFulfilled] = useState(false)

  async function loadOrder() {
    const res = await fetch(`/api/admin/orders/${id}`)
    const data = await res.json()
    if (data.success) setOrder(data.data)
  }

  useEffect(() => {
    loadOrder().finally(() => setLoading(false))
  }, [id])

  async function handleFulfill() {
    if (!confirm("Manual fulfill order ini?")) return
    setFulfilling(true)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fulfill" }),
    })
    const data = await res.json()
    if (data.success) {
      setFulfilled(true)
      await loadOrder()
    }
    setFulfilling(false)
  }

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  if (!order) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Order tidak ditemukan</p>
      <Link href="/admin/orders"><Button variant="outline" className="mt-4">Kembali</Button></Link>
    </div>
  )

  const items = order.items as Array<{ id: string; variant: { name: string }; quantity: number; price: number }>
  const stocks = order.stocks as Array<{ id: string; credentials: string; status: string }>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-mono">{order.orderNumber as string}</h1>
          <p className="text-sm text-muted-foreground">{order.customerName as string} • {order.customerEmail as string}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status as string] ?? "outline"}>
          {STATUS_LABEL[order.status as string] ?? order.status as string}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {order.status !== "FULFILLED" && order.status !== "FAILED" && (
          <Button onClick={handleFulfill} disabled={fulfilling} className="gap-2">
            {fulfilling
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : fulfilled
              ? <CheckCircle2 className="h-4 w-4" />
              : <CheckCircle2 className="h-4 w-4" />}
            {fulfilling ? "Memproses..." : "Manual Fulfill"}
          </Button>
        )}
        {(order.xenditPaymentUrl as string | undefined) && (
          <a href={order.xenditPaymentUrl as string} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Lihat Invoice Xendit
            </Button>
          </a>
        )}
        <Button variant="ghost" size="icon" onClick={loadOrder} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detail Pesanan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pb-3 border-b">
            <div>Metode Bayar</div>
            <div className="font-medium text-foreground">{order.paymentMethod as string ?? "-"}</div>
            <div>Dibuat</div>
            <div className="font-medium text-foreground">{new Date(order.createdAt as string).toLocaleString("id-ID")}</div>
            {order.paidAt && <>
              <div>Dibayar</div>
              <div className="font-medium text-foreground">{new Date(order.paidAt as string).toLocaleString("id-ID")}</div>
            </>}
          </div>
          <div className="space-y-1.5">
            {items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.variant.name} ×{item.quantity}</span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total as number)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stocks */}
      {stocks?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Credentials Terkirim</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stocks.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{s.credentials}</code>
                <Badge variant={s.status === "DELIVERED" ? "default" : "secondary"} className="shrink-0 text-xs">{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
