"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Eye, EyeOff, Pin } from "lucide-react"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  comment: string
  isVisible: boolean
  isPinned: boolean
  createdAt: string
  product: { name: string }
}

export default function ReviewList({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial)

  async function toggleField(id: string, field: string, value: boolean) {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: !value }),
    })
    if (res.ok) {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, [field]: !value } : r))
      toast.success("Diperbarui")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ulasan Pembeli</h1>
      <Card>
        <CardHeader><CardTitle>Semua Ulasan ({reviews.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />)}
                  </div>
                  <Badge variant="outline" className="text-xs">{r.product.name}</Badge>
                  {r.isPinned && <Badge className="text-xs" variant="default">Dipin</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleField(r.id, "isPinned", r.isPinned)}>
                    <Pin className={`h-3.5 w-3.5 ${r.isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  </button>
                  <button onClick={() => toggleField(r.id, "isVisible", r.isVisible)}>
                    {r.isVisible ? <Eye className="h-3.5 w-3.5 text-green-500" /> : <EyeOff className="h-3.5 w-3.5 text-destructive" />}
                  </button>
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
