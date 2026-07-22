"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Eye, EyeOff, Pin, MessageSquare, Check, X } from "lucide-react"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

interface Review {
  id: string
  rating: number
  comment: string
  isVisible: boolean
  isPinned: boolean
  status?: string
  createdAt: string | null
  product?: { name: string }
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
        Disetujui
      </span>
    )
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
        Ditolak
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
      Menunggu
    </span>
  )
}

export default function ReviewList({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial)

  async function toggleField(id: string, field: string, value: boolean) {
    const res = await fetch(goAPI(`/api/admin/reviews/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !value }),
      credentials: "include",
    })
    if (res.ok) {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, [field]: !value } : r))
      toast.success("Diperbarui")
    }
  }

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(goAPI(`/api/admin/reviews/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include",
    })
    if (res.ok) {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      toast.success(status === "APPROVED" ? "Ulasan disetujui" : "Ulasan ditolak")
    } else {
      toast.error("Gagal memperbarui status")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ulasan Pembeli</h1>
      <Card>
        <CardHeader><CardTitle>Semua Ulasan ({reviews.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reviews.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Belum ada ulasan.</p>
            </div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="space-y-1 min-w-0">
                  {/* Product name */}
                  <p className="text-xs font-medium text-primary truncate">{r.product?.name ?? "Produk"}</p>
                  {/* Star rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    {r.isPinned && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                        Dipin
                      </span>
                    )}
                    <StatusBadge status={r.status} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Approve / Reject */}
                  {(!r.status || r.status === "PENDING") && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => setStatus(r.id, "APPROVED")}
                        aria-label="Setujui ulasan"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setStatus(r.id, "REJECTED")}
                        aria-label="Tolak ulasan"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleField(r.id, "isPinned", r.isPinned)}
                    aria-label={r.isPinned ? "Unpin ulasan" : "Pin ulasan"}
                  >
                    <Pin className={`h-3.5 w-3.5 ${r.isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleField(r.id, "isVisible", r.isVisible)}
                    aria-label={r.isVisible ? "Sembunyikan ulasan" : "Tampilkan ulasan"}
                  >
                    {r.isVisible
                      ? <Eye className="h-3.5 w-3.5 text-green-500" />
                      : <EyeOff className="h-3.5 w-3.5 text-destructive" />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
