"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

interface Claim {
  id: string
  warrantyId: string
  claimReason: string | null
  rejectionReason: string | null
  status: string
  submittedAt: string | null
  reviewedAt: string | null
  order?: { orderNumber: string; guestEmail: string | null; guestName: string | null }
  orderItem?: { variant: { product: { name: string } } }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
        Baru
      </span>
    )
  }
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
        Disetujui
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
      Ditolak
    </span>
  )
}

export default function WarrantyList({ claims: initial }: { claims: Claim[] }) {
  const [claims, setClaims] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  async function handleAction(id: string, action: "approve" | "reject") {
    const body: Record<string, unknown> = { action }
    if (action === "reject" && !rejectNote) return toast.error("Alasan penolakan diperlukan")
    if (action === "reject") body.note = rejectNote
    const res = await fetch(goAPI(`/api/admin/warranty/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    })
    if (!res.ok) return toast.error("Gagal memproses klaim")
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: action === "approve" ? "APPROVED" : "REJECTED", rejectionReason: (body.note as string) || null }
          : c
      )
    )
    setExpanded(null)
    setRejectNote("")
    toast.success(action === "approve" ? "Klaim disetujui! Penggantian dikirim." : "Klaim ditolak")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Klaim Garansi</h1>
      <Card>
        <CardHeader><CardTitle>Semua Klaim</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {claims.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Belum ada klaim.</p>
            </div>
          )}
          {claims.map((c) => (
            <div key={c.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <span className="text-sm font-medium">#{c.order?.orderNumber}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  aria-label={expanded === c.id ? "Tutup detail" : "Buka detail"}
                >
                  {expanded === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Prominent product name + customer email */}
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{c.orderItem?.variant.product.name}</p>
                <p className="text-xs text-muted-foreground">{c.order?.guestEmail ?? "N/A"}</p>
              </div>

              <p className="text-sm text-muted-foreground">{c.claimReason}</p>

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
