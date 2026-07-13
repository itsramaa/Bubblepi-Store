"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string | Date
  order?: { customerName?: string | null } | null
}

interface Props {
  productId: string
  reviews: Review[]
  avgRating: number
}

export default function ReviewSection({ productId, reviews, avgRating }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [orderId, setOrderId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, orderId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Gagal kirim ulasan")
      toast.success("Ulasan berhasil dikirim!")
      setShowForm(false)
      setComment("")
      setOrderId("")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  // Rating breakdown
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
    pct: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === n).length / reviews.length) * 100)
      : 0,
  }))

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ulasan Pembeli</h2>
          {reviews.length > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              ⭐ {avgRating.toFixed(1)} dari {reviews.length} ulasan
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          + Tulis Ulasan
        </Button>
      </div>

      {/* Rating Breakdown Bars */}
      {reviews.length > 0 && (
        <div className="mb-8 p-4 rounded-xl border bg-muted/20 space-y-2">
          <p className="text-sm font-medium mb-3">Rincian Rating</p>
          {breakdown.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 shrink-0 text-right">
                {star} ⭐
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 shrink-0">{count}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl border bg-muted/30 space-y-4">
          <p className="text-sm text-muted-foreground">Hanya pembeli yang sudah checkout bisa menulis ulasan.</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Order ID</label>
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ID pesanan kamu" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Komentar</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Bagaimana pengalamanmu?" required rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} size="sm">{submitting ? "Mengirim..." : "Kirim Ulasan"}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Belum ada ulasan. Jadilah yang pertama!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const firstName = r.order?.customerName?.split(" ")[0] ?? "Pembeli"
            const initial = firstName.charAt(0).toUpperCase()
            return (
              <div key={r.id} className="p-4 rounded-xl border bg-muted/20">
                <div className="flex items-start gap-3">
                  {/* Avatar initial circle */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#595B83] to-[#F4ABC4] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{firstName}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                    <p className="text-sm">{r.comment}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
