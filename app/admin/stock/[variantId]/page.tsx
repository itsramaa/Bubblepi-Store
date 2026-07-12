"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

interface StockItem {
  id: string
  credentials: string
  status: string
  createdAt: string
}

export default function AdminStockDetailPage() {
  const { variantId } = useParams<{ variantId: string }>()
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [bulk, setBulk] = useState("")
  const [saving, setSaving] = useState(false)

  async function loadStocks() {
    const res = await fetch(`/api/admin/stock?variantId=${variantId}`)
    // ponytail: filter by variantId on client side — add server-side filter post-MVP
    const data = await res.json()
    if (data.success) setStocks(data.data.filter((s: StockItem & { variantId: string }) => s.variantId === variantId))
  }

  useEffect(() => { loadStocks() }, [variantId])

  async function handleBulkAdd() {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return
    setSaving(true)
    for (const credentials of lines) {
      await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, credentials }),
      })
    }
    setBulk("")
    await loadStocks()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/stock/${id}`, { method: "DELETE" })
    setStocks((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Kelola Stok</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Tambah Stok (bulk)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={"Masukkan satu credentials per baris:\nemail:password\nusername|password"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={5}
          />
          <Button onClick={handleBulkAdd} disabled={saving || !bulk.trim()}>
            {saving ? "Menyimpan..." : `Tambah ${bulk.split("\n").filter((l) => l.trim()).length} item`}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {stocks.map((stock) => (
          <div key={stock.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{stock.credentials}</code>
            <Badge variant={stock.status === "AVAILABLE" ? "default" : "secondary"}>{stock.status}</Badge>
            {stock.status === "AVAILABLE" && (
              <Button variant="ghost" size="icon" onClick={() => handleDelete(stock.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {stocks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada stok</p>}
      </div>
    </div>
  )
}
