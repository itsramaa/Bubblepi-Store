"use client"

import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  { name: "Aulia", text: "Mantap! Akun Netflix langsung aktif, admin fast response 👍", rating: 5 },
  { name: "Rizky", text: "Udah 3 bulan langganan Canva disini, aman terus.", rating: 5 },
  { name: "Dinda", text: "Murah banget, ChatGPT sharing cuma 50rb. Recommended!", rating: 5 },
]

export default function TestimonialsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold mb-8 text-center">Testimoni</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex mb-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-sm mb-4">&ldquo;{t.text}&rdquo;</p>
              <p className="font-semibold text-sm">— {t.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
