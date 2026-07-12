"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string | Date
}

interface Props {
  reviews: Review[]
}

export default function TestimonialCarousel({ reviews }: Props) {
  if (reviews.length === 0) return null

  return (
    <section className="py-12 bg-gradient-to-r from-[#F4ABC4]/10 to-[#595B83]/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h2 className="text-2xl font-bold text-center">Kata Mereka</h2>
        <p className="text-muted-foreground text-center mt-1">Ulasan dari pembeli yang sudah puas</p>
      </div>
      <div className="flex gap-4 animate-scroll hover:[animation-play-state:paused]" style={{ width: "max-content" }}>
        {[...reviews, ...reviews].map((r, i) => (
          <Card key={`${r.id}-${i}`} className="w-72 shrink-0">
            <CardContent className="p-4">
              <div className="flex mb-2">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              <p className="text-sm line-clamp-3">{r.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleDateString("id-ID")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
