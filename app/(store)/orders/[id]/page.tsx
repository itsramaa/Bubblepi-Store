"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import OrderTimeline from "@/components/store/OrderTimeline"
import CredentialsCard from "@/components/store/CredentialsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import type { OrderWithItems } from "@/types"

const TERMINAL_STATUSES = ["FULFILLED", "FAILED"]

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`)
        const data = await res.json()
        if (data.success) setOrder(data.data)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    const startTime = Date.now()
    const intervalId = setInterval(() => {
      if (Date.now() - startTime > 30 * 60 * 1000) { clearInterval(intervalId); return }
      fetchOrder()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [id])

  // Stop polling when terminal
  useEffect(() => {
    if (order && TERMINAL_STATUSES.includes(order.status)) return
  }, [order])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-8">Pesanan tidak ditemukan</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Status Pesanan</h1>
      <p className="text-muted-foreground mb-8">Order #{order.orderNumber}</p>

      <OrderTimeline status={order.status} />

      <Card className="mt-8">
        <CardHeader><CardTitle>Detail Pesanan</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.variant.name} x{item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      {order.status === "FULFILLED" && order.stocks.length > 0 && (
        <CredentialsCard stocks={order.stocks} />
      )}
    </div>
  )
}
