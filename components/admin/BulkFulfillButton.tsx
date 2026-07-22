"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

interface Props {
  pendingCount: number
}

export default function BulkFulfillButton({ pendingCount }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleBulkFulfill() {
    if (!confirm(`Fulfill semua ${pendingCount} pesanan PAID sekaligus?`)) return
    setLoading(true)
    try {
      const res = await fetch(goAPI("/api/admin/orders?status=PAID&pageSize=100"), { credentials: "include" })
      const data = await res.json()
      const orderIds = (data.orders ?? []).map((o: { id: string }) => o.id)
      if (orderIds.length === 0) {
        toast.info("Tidak ada pesanan PAID untuk di-fulfill")
        return
      }
      const fulfillRes = await fetch(goAPI("/api/admin/orders/bulk-fulfill"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
        credentials: "include",
      })
      const fulfillData = await fulfillRes.json()
      if (!fulfillData.success) throw new Error(fulfillData.error)
      toast.success(`${fulfillData.data.succeeded} pesanan berhasil di-fulfill${fulfillData.data.failed > 0 ? `, ${fulfillData.data.failed} gagal` : ""}`)
      window.location.reload()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal bulk fulfill")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleBulkFulfill} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {loading ? "Memproses..." : `Fulfill Semua (${pendingCount})`}
    </Button>
  )
}