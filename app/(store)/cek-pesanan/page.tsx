"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/utils"
import { Search, Package, ArrowRight, Clock, CreditCard, CheckCircle2, XCircle, Hourglass, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { goAPI } from "@/lib/api-client"

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: { quantity: number; variant: { name: string; product: { name: string } } }[]
}

interface StatusConfig {
  label: string
  icon: React.ReactNode
  className: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    label: "Menunggu Bayar",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300",
  },
  PAID: {
    label: "Dibayar",
    icon: <CreditCard className="h-3.5 w-3.5" />,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300",
  },
  DELIVERED: {
    label: "Selesai",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300",
  },
  FAILED: {
    label: "Gagal",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300",
  },
  PENDING_STOCK: {
    label: "Menunggu Stok",
    icon: <Hourglass className="h-3.5 w-3.5" />,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300",
  },
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
      const res = await fetch(goAPI(`/api/orders?email=${encodeURIComponent(email.trim())}`), { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Gagal mencari pesanan")
      setOrders(Array.isArray(data) ? data : data.orders ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
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

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 w-full">
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

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm text-center mb-4">{error}</p>
      )}

      {!loading && orders !== null && orders.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p>Tidak ada pesanan ditemukan untuk email ini.</p>
          <Link href="/products" className="text-primary text-sm mt-2 inline-block hover:underline">
            Mulai belanja →
          </Link>
        </div>
      )}

      {!loading && orders && orders.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{orders.length} pesanan ditemukan</p>
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] ?? { label: order.status, icon: null, className: "bg-gray-100 text-gray-800" }
            return (
              <Card key={order.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm">#{order.orderNumber}</p>
                        <Badge variant="outline" className={`text-xs gap-1 border ${config.className}`}>
                          {config.icon}
                          {config.label}
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
