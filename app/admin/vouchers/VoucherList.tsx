"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Power, PowerOff, Tags } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { goAPI } from "@/lib/api-client"

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
    const res = await fetch(goAPI(`/api/admin/vouchers/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
      credentials: "include",
    })
    if (res.ok) {
      setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: !current } : v)))
      toast.success(current ? "Voucher dinonaktifkan" : "Voucher diaktifkan")
    } else {
      toast.error("Gagal mengubah status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voucher / Promo</h1>
        <Link href="/admin/vouchers/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Buat Voucher</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Semua Voucher</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vouchers.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada voucher.</p>
              </div>
            )}
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                  <Badge variant={v.isActive ? "default" : "secondary"} className="text-xs font-mono">{v.code}</Badge>
                  <span className="text-sm">{v.type === "PERCENT" ? `${v.value}%` : `Rp ${v.value.toLocaleString("id-ID")}`}</span>
                  <span className="text-xs text-muted-foreground">Min: {v.minOrder.toLocaleString("id-ID")}</span>
                  <span className="text-xs text-muted-foreground">Pakai: {v.usedCount}{v.maxUses ? `/${v.maxUses}` : ""}</span>
                  {v.expiresAt && <span className="text-xs text-muted-foreground">Exp: {new Date(v.expiresAt).toLocaleDateString("id-ID")}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive(v.id, v.isActive)}
                  aria-label={v.isActive ? "Nonaktifkan voucher" : "Aktifkan voucher"}
                >
                  {v.isActive ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
