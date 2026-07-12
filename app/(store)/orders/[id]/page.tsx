"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import OrderTimeline from "@/components/store/OrderTimeline"
import CredentialsCard from "@/components/store/CredentialsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import type { OrderWithItems } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const TERMINAL_STATUSES = ["FULFILLED", "FAILED"]

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`)
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        if (TERMINAL_STATUSES.includes(data.data.status)) setPolling(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    if (!polling) return
    const interval = setInterval(fetchOrder, 8000)
    return () => clearInterval(interval)
  }, [id, polling])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Card><CardContent className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-semibold">Pesanan tidak ditemukan</p>
        <p className="text-muted-foreground text-sm">Pastikan order ID benar.</p>
        <Link href="/"><Button variant="outline">Kembali ke Beranda</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold">Status Pesanan</h1>
        {polling && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" /> Auto-refresh
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-8">Order #{order.orderNumber}</p>

      {/* Timeline */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <OrderTimeline status={order.status} />
        </CardContent>
      </Card>

      {/* Order detail */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detail Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Nama</span><span className="text-foreground font-medium">{order.customerName}</span></div>
            <div className="flex justify-between"><span>Email</span><span className="text-foreground font-medium">{order.customerEmail}</span></div>
          </div>
          <div className="border-t pt-3 space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.variant.name} ×{item.quantity}</span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      {order.status === "FULFILLED" && order.stocks.length > 0 && (
        <CredentialsCard stocks={order.stocks} />
      )}
    </div>
  )
}
