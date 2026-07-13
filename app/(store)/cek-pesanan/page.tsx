"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Search, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: { quantity: number; variant: { name: string; product: { name: string } } }[]
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Menunggu Bayar", variant: "secondary" },
  PAID: { label: "Dibayar", variant: "default" },
  FULFILLED: { label: "Selesai", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  EXPIRED: { label: "Kedaluwarsa", variant: "outline" },
}

export default function OrderLookupPage() {
  const [email, setEmail] = useState("")
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    setOrders(null)
    try {
      const res = await fetch(`/api/orders/lookup-by-email?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Gagal mencari pesanan")
      setOrders(data.orders)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Package className="h-12 w-12 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Cek Pesanan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Masukkan email yang kamu gunakan saat checkout
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input
          type="email"
          placeholder="emailkamu@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={loading} className="gap-2">
          <Search className="h-4 w-4" />
          {loading ? "Mencari..." : "Cari"}
        </Button>
      </form>

      {error && (
        <p className="text-destructive text-sm text-center mb-4">{error}</p>
      )}

      {orders !== null && orders.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p>Tidak ada pesanan ditemukan untuk email ini.</p>
          <Link href="/products" className="text-primary text-sm mt-2 inline-block hover:underline">
            Mulai belanja →
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{orders.length} pesanan ditemukan</p>
          {orders.map((order) => {
            const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, variant: "outline" as const }
            return (
              <Card key={order.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">#{order.orderNumber}</p>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                      <div className="space-y-0.5">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {item.quantity}× {item.variant.product.name} — {item.variant.name}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">{formatPrice(order.total)}</p>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs mt-1">
                          Detail <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
