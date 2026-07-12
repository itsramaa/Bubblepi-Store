"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface StockItem {
  id: string
  credentials: string
  status: string
  expiresAt: string | null
  createdAt: string
}

export default function AdminStockDetailPage() {
  const { variantId } = useParams<{ variantId: string }>()
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [bulk, setBulk] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [saving, setSaving] = useState(false)

  async function loadStocks() {
    const res = await fetch(`/api/admin/stock?variantId=${variantId}`)
    const data = await res.json()
    if (data.success) setStocks(data.data.filter((s: StockItem & { variantId: string }) => s.variantId === variantId))
  }

  useEffect(() => { loadStocks() }, [variantId])

  async function handleBulkAdd() {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return
    setSaving(true)
    let ok = 0
    for (const credentials of lines) {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          credentials,
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        }),
      })
      if ((await res.json()).success) ok++
    }
    toast.success(`${ok} credentials berhasil ditambahkan`)
    setBulk("")
    setExpiresAt("")
    await loadStocks()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/stock/${id}`, { method: "DELETE" })
    setStocks((prev) => prev.filter((s) => s.id !== id))
    toast.success("Stok dihapus")
  }

  const available = stocks.filter((s) => s.status === "AVAILABLE")
  const used = stocks.filter((s) => s.status !== "AVAILABLE")

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Kelola Stok</h1>

      <Card>
        <CardHeader><CardTitle>Tambah Stok (bulk)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Credentials (satu per baris)</Label>
            <Textarea
              placeholder={"email:password\nusername|password"}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tanggal Expired (opsional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
            <p className="text-xs text-muted-foreground">Kosongkan jika credentials tidak ada masa berlaku.</p>
          </div>
          <Button onClick={handleBulkAdd} disabled={saving || !bulk.trim()}>
            {saving ? "Menyimpan..." : `Tambah ${bulk.split("\n").filter((l) => l.trim()).length} item`}
          </Button>
        </CardContent>
      </Card>

      {/* Available */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Tersedia ({available.length})
        </h2>
        {available.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada stok tersedia</p>
        )}
        {available.map((stock) => (
          <div key={stock.id} className={`flex items-center gap-3 p-3 border rounded-lg ${isExpired(stock.expiresAt) ? "border-destructive/40 bg-destructive/5" : ""}`}>
            <div className="flex-1 min-w-0">
              <code className="text-xs bg-muted p-1.5 rounded font-mono block truncate">{stock.credentials}</code>
              {stock.expiresAt && (
                <p className={`text-xs mt-1 ${isExpired(stock.expiresAt) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {isExpired(stock.expiresAt) ? "⚠ Expired" : "Exp"}: {new Date(stock.expiresAt).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
            <Badge variant={isExpired(stock.expiresAt) ? "destructive" : "default"} className="shrink-0">
              {isExpired(stock.expiresAt) ? "EXPIRED" : "AVAILABLE"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(stock.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Used */}
      {used.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Terpakai ({used.length})
          </h2>
          {used.map((stock) => (
            <div key={stock.id} className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
              <code className="flex-1 text-xs bg-muted p-1.5 rounded font-mono truncate">{stock.credentials}</code>
              <Badge variant="secondary" className="shrink-0 text-xs">{stock.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
