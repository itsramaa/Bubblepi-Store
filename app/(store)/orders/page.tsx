"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Menunggu Bayar",
  PAID: "Dibayar",
  FULFILLED: "Selesai",
  FAILED: "Gagal",
  PENDING_STOCK: "Menunggu Stok",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FULFILLED: "default",
  PAID: "secondary",
  PENDING: "outline",
  AWAITING_PAYMENT: "outline",
  FAILED: "destructive",
  PENDING_STOCK: "destructive",
}

export default function OrderLookupPage() {
  const [email, setEmail] = useState("")
  const [orders, setOrders] = useState<Array<Record<string, any>>>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/orders/lookup?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Lacak Pesanan</h1>
      <p className="text-muted-foreground text-center mb-8">
        Masukkan email yang kamu gunakan saat checkout
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <Input
          type="email"
          placeholder="email@contoh.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="gap-2 shrink-0">
          <Search className="h-4 w-4" />
          {loading ? "Mencari..." : "Cari"}
        </Button>
      </form>

      {searched && orders.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Tidak ada pesanan ditemukan untuk email ini.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card className="hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.items.map((i: any) => i.variantName).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                    <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
