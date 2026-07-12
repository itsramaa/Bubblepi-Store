"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"
import { toast } from "sonner"

interface Review { id: string; rating: number; comment: string; createdAt: string | Date }

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
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

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
              {[1,2,3,4,5].map((n) => (
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
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
              <p className="text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
