"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleFulfill() {
    setFulfilling(true)
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fulfill" }),
    })
    setFulfilling(false)
    router.refresh()
  }

  if (loading) return <div>Loading...</div>
  if (!order) return <div>Order tidak ditemukan</div>

  const items = order.items as Array<{ id: string; variant: { name: string }; quantity: number; price: number }>
  const stocks = order.stocks as Array<{ id: string; credentials: string; status: string }>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber as string}</h1>
          <p className="text-muted-foreground">{order.customerName as string} • {order.customerEmail as string}</p>
        </div>
        <Badge>{order.status as string}</Badge>
      </div>

      <div className="flex gap-2 mb-6">
        {order.status !== "FULFILLED" && (
          <Button onClick={handleFulfill} disabled={fulfilling}>
            {fulfilling ? "Memproses..." : "Manual Fulfill"}
          </Button>
        )}
        {(order.xenditPaymentUrl as string | undefined) && (
          <a href={order.xenditPaymentUrl as string} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Lihat Invoice Xendit</Button>
          </a>
        )}
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.variant.name} x{item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span><span>{formatPrice(order.total as number)}</span>
          </div>
        </CardContent>
      </Card>

      {stocks?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Stok Terkirim</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stocks.map((s) => (
              <div key={s.id} className="flex justify-between text-sm font-mono">
                <span className="truncate">{s.credentials}</span>
                <Badge variant="secondary">{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
