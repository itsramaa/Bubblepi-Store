"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Voucher {
  id: string
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
}

export default function VoucherList({ vouchers: initial }: { vouchers: Voucher[] }) {
  const [vouchers, setVouchers] = useState(initial)

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch("/api/admin/vouchers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    })
    if (res.ok) {
      setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: !current } : v)))
      toast.success(current ? "Voucher dinonaktifkan" : "Voucher diaktifkan")
    } else {
      toast.error("Gagal mengubah status")
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voucher / Promo</h1>
        <Link href="/admin/vouchers/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Buat Voucher</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Semua Voucher</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vouchers.length === 0 && <p className="text-muted-foreground text-sm">Belum ada voucher.</p>}
            {vouchers.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant={v.isActive ? "default" : "secondary"} className="text-xs font-mono">{v.code}</Badge>
                  <span className="text-sm">{v.type === "PERCENT" ? `${v.value}%` : `${v.value.toLocaleString("id-ID")}`}</span>
                  <span className="text-xs text-muted-foreground">Min: {v.minOrder.toLocaleString("id-ID")}</span>
                  <span className="text-xs text-muted-foreground">Pakai: {v.usedCount}{v.maxUses ? `/${v.maxUses}` : ""}</span>
                  {v.expiresAt && <span className="text-xs text-muted-foreground">Exp: {new Date(v.expiresAt).toLocaleDateString("id-ID")}</span>}
                </div>
                <button onClick={() => toggleActive(v.id, v.isActive)}>
                  {v.isActive ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
