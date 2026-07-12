"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

interface Claim {
  id: string
  orderId: string
  orderItemId: string
  description: string
  status: string
  resolveNote: string | null
  createdAt: string
  resolvedAt: string | null
  order: { orderNumber: string; customerEmail: string; customerName: string }
  orderItem: { variant: { product: { name: string } } }
}

export default function WarrantyList({ claims: initial }: { claims: Claim[] }) {
  const [claims, setClaims] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  async function handleAction(id: string, action: "approve" | "reject") {
    const body: any = { id, action }
    if (action === "reject" && !rejectNote) return toast.error("Alasan penolakan diperlukan")
    if (action === "reject") body.note = rejectNote
    const res = await fetch("/api/admin/warranty", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return toast.error("Gagal memproses klaim")
    setClaims((prev) => prev.map((c) => c.id === id ? { ...c, status: action === "approve" ? "APPROVED" : "REJECTED", resolveNote: body.note || null } : c))
    setExpanded(null)
    setRejectNote("")
    toast.success(action === "approve" ? "Klaim disetujui! Penggantian dikirim." : "Klaim ditolak")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Klaim Garansi</h1>
      <Card>
        <CardHeader><CardTitle>Semua Klaim</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {claims.length === 0 && <p className="text-muted-foreground text-sm">Belum ada klaim.</p>}
          {claims.map((c) => (
            <div key={c.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "PENDING" ? "secondary" : c.status === "APPROVED" ? "default" : "destructive"}>
                    {c.status === "PENDING" ? "Baru" : c.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                  </Badge>
                  <span className="text-sm font-medium">#{c.order.orderNumber}</span>
                </div>
                <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  {expanded === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-sm text-muted-foreground">
                {c.order.customerName} — {c.orderItem.variant.product.name}
              </div>
              <p className="text-sm">{c.description}</p>

              {expanded === c.id && c.status === "PENDING" && (
                <div className="pt-2 space-y-2 border-t">
                  <Textarea
                    placeholder="Alasan penolakan (wajib jika ditolak)"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => handleAction(c.id, "approve")}>Setujui + Kirim Pengganti</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, "reject")}>Tolak</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
