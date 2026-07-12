"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function BulkFulfillButton({ pendingCount }: { pendingCount: number }) {
  const [loading, setLoading] = useState(false)

  async function handleBulkFulfill() {
    if (!confirm(`Bulk fulfill ${pendingCount} order PENDING_STOCK? Stok harus sudah tersedia.`)) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/orders/bulk-fulfill", { method: "POST" })
      const data = await res.json()
      if (data.fulfilled > 0) {
        toast.success(`${data.fulfilled} order berhasil di-fulfill`)
      } else {
        toast.info("Tidak ada order yang bisa di-fulfill (cek stok)")
      }
      if (data.errors?.length) {
        toast.error(`${data.errors.length} order gagal: ${data.errors[0]}`)
      }
      // Reload page untuk update counts
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.error("Gagal bulk fulfill")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleBulkFulfill} disabled={loading} className="gap-2 text-sm">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      Fulfill {pendingCount} PENDING_STOCK
    </Button>
  )
}
