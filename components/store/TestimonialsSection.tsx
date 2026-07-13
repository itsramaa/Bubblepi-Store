"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string
  customerName: string
  createdAt: string | Date
  productName?: string
}

// Fallback static testimonials if no DB reviews yet
const staticTestimonials: Review[] = [
  { id: "1", rating: 5, comment: "Keren banget! Akun Netflix langsung masuk email dalam 2 menit. Harga paling murah se-Indonesia 😂", customerName: "Andi S.", createdAt: new Date(), productName: "Netflix Premium" },
  { id: "2", rating: 5, comment: "Udah 3x beli di sini, selalu lancar. Garansi juga beneran direplace kalau ada masalah.", customerName: "Rizky P.", createdAt: new Date(), productName: "Spotify Premium" },
  { id: "3", rating: 5, comment: "ChatGPT Plus murah banget, gak nyangka. Proses cepat dan seller responsif.", customerName: "Dewi R.", createdAt: new Date(), productName: "ChatGPT Plus" },
  { id: "4", rating: 5, comment: "Canva Pro-nya works perfect! Langsung bisa pakai semua fitur premium.", customerName: "Budi K.", createdAt: new Date(), productName: "Canva Pro" },
  { id: "5", rating: 4, comment: "Pelayanan bagus, harga bersaing. Recommended buat yang butuh akun premium murah.", customerName: "Siti M.", createdAt: new Date(), productName: "Disney+ Hotstar" },
  { id: "6", rating: 5, comment: "Ini toko langganan gue buat beli akun digital. Fast response, honest seller!", customerName: "Fitra A.", createdAt: new Date(), productName: "YouTube Premium" },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  )
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

const avatarColors = [
  "bg-[#595B83] text-white",
  "bg-[#F4ABC4] text-[#333456]",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-blue-500 text-white",
  "bg-rose-500 text-white",
]

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>(staticTestimonials)

  useEffect(() => {
    fetch("/api/reviews/featured")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length >= 3) setReviews(d)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">Testimoni</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Yang Mereka Bilang</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Lebih dari 500 pembeli puas — ini cerita mereka
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map((review, i) => (
          <Card key={review.id} className="hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <StarRating rating={review.rating} />
              <p className="text-sm text-muted-foreground mt-3 mb-4 leading-relaxed line-clamp-4">
                &ldquo;{review.comment}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {getInitials(review.customerName)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{review.customerName}</p>
                  {review.productName && (
                    <p className="text-xs text-muted-foreground">{review.productName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
