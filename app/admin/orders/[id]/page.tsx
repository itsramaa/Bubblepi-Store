"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, RefreshCw, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", AWAITING_PAYMENT: "Menunggu Bayar", PAID: "Dibayar",
  DELIVERED: "Selesai", FAILED: "Gagal/Batal", PENDING_STOCK: "Menunggu Stok",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DELIVERED: "default", PAID: "secondary", PENDING: "outline",
  AWAITING_PAYMENT: "outline", FAILED: "destructive", PENDING_STOCK: "destructive",
}

interface AdminOrder {
  id: string
  orderNumber: string
  status: string
  guestName: string | null
  guestEmail: string | null
  paymentMethod: string | null
  total: number
  createdAt: string
  paidAt: string | null
  cancelReason: string | null
  xenditPaymentUrl: string | null
  items: Array<{ id: string; variant: { name: string }; quantity: number; price: number }>
  stocks?: Array<{ id: string; credentials: string; status: string }>
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  function refreshOrder() {
    fetch(goAPI(`/api/admin/orders/${id}`), { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setOrder(d.data) })
  }

  useEffect(() => {
    fetch(goAPI(`/api/admin/orders/${id}`), { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setOrder(d.data) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleFulfill() {
    if (!confirm("Manual fulfill order ini?")) return
    setFulfilling(true)
    const res = await fetch(goAPI(`/api/admin/orders/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "fulfill" }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success("Order berhasil di-fulfill")
      await refreshOrder()
    } else {
      toast.error("Gagal fulfill order")
    }
    setFulfilling(false)
  }

  async function handleCancel() {
    if (!cancelReason.trim()) { toast.error("Isi alasan pembatalan"); return }
    setCancelling(true)
    const res = await fetch(goAPI(`/api/admin/orders/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "cancel", reason: cancelReason }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success("Order dibatalkan")
      setShowCancel(false)
      await refreshOrder()
    } else {
      toast.error(data.error ?? "Gagal membatalkan order")
    }
    setCancelling(false)
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

  const isTerminal = ["DELIVERED", "FAILED"].includes(order.status)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-mono">{order.orderNumber as string}</h1>
          <p className="text-sm text-muted-foreground">{order.guestName as string} • {order.guestEmail as string}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
          {STATUS_LABEL[order.status] ?? order.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!isTerminal && (
          <Button onClick={handleFulfill} disabled={fulfilling} className="gap-2">
            {fulfilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {fulfilling ? "Memproses..." : "Manual Fulfill"}
          </Button>
        )}
        {!isTerminal && !showCancel && (
          <Button variant="destructive" onClick={() => setShowCancel(true)} className="gap-2">
            <XCircle className="h-4 w-4" /> Batalkan Order
          </Button>
        )}
        {typeof order.xenditPaymentUrl === "string" && order.xenditPaymentUrl && (
          <a href={order.xenditPaymentUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Lihat Invoice Xendit
            </Button>
          </a>
        )}
        <Button variant="ghost" size="icon" onClick={refreshOrder} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Cancel form */}
      {showCancel && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 space-y-3">
            <Label>Alasan Pembatalan</Label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Misal: Stok habis, permintaan pembeli, dll"
            />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="gap-2">
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Konfirmasi Batalkan
              </Button>
              <Button variant="outline" onClick={() => setShowCancel(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel reason display */}
      {order.cancelReason && (
        <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
          <span className="font-medium text-destructive">Alasan Pembatalan:</span>{" "}
          {order.cancelReason as string}
        </div>
      )}

      {/* Order detail */}
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
            {order.items.map((item) => (
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
      {order.stocks && order.stocks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Credentials Terkirim</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {order.stocks.map((s) => (
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
