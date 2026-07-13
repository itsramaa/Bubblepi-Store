"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    badge: "⚡ Proses Otomatis",
    title: "Akun Premium\nInstan",
    subtitle: "Bayar sekarang, terima dalam menit",
    cta: "Belanja Sekarang",
    href: "/products",
    socialProof: null as string | null,
    accent: "from-[#060930] via-[#333456] to-[#595B83]",
  },
  {
    badge: "🛡️ Belanja Aman",
    title: "Garansi\n30 Hari",
    subtitle: "Ada masalah? Kami ganti tanpa tanya-tanya",
    cta: "Lihat Produk",
    href: "/products",
    socialProof: null,
    accent: "from-[#1a1040] via-[#2d1b5e] to-[#595B83]",
  },
  {
    badge: "✅ Dipercaya Ribuan Pembeli",
    title: "100% Aman\n& Terpercaya",
    subtitle: "5.000+ pelanggan puas berbelanja di sini",
    cta: "Mulai Belanja",
    href: "/products",
    socialProof: "🔥 Sudah 5.000+ pembeli puas",
    accent: "from-[#0a2540] via-[#1a3a5c] to-[#595B83]",
  },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const changeSlide = useCallback(
    (next: number) => {
      if (next === current || isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(next)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 280)
    },
    [current, isTransitioning]
  )

  useEffect(() => {
    const timer = setInterval(
      () => changeSlide((current + 1) % slides.length),
      5500
    )
    return () => clearInterval(timer)
  }, [current, changeSlide])

  const slide = slides[current]

  return (
    <div className={`relative h-[420px] md:h-[520px] bg-gradient-to-br ${slide.accent} overflow-hidden transition-all duration-700`}>
      {/* Decorative blobs */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#F4ABC4]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div
        className="absolute inset-0 flex items-center justify-center text-center px-4 transition-all duration-500 ease-out"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateY(12px)" : "translateY(0)",
        }}
      >
        <div key={current} className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5 text-white/90">
            {slide.badge}
          </div>

          {/* Title with line breaks */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white leading-tight whitespace-pre-line">
            {slide.title}
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-6">
            {slide.subtitle}
          </p>

          {slide.socialProof && (
            <p className="text-sm font-medium text-amber-300 mb-6">
              {slide.socialProof}
            </p>
          )}

          <a href={slide.href}>
            <Button
              size="lg"
              className="bg-[#F4ABC4] text-[#333456] hover:bg-[#F4ABC4]/90 font-semibold px-8"
            >
              {slide.cta}
            </Button>
          </a>
        </div>
      </div>

      {/* Nav buttons */}
      <button
        aria-label="Slide sebelumnya"
        onClick={() => changeSlide((current - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button
        aria-label="Slide berikutnya"
        onClick={() => changeSlide((current + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-[#F4ABC4]"
                : "w-2 h-2 bg-white/30 hover:bg-white/50"
            }`}
            onClick={() => changeSlide(i)}
          />
        ))}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background/40 to-transparent" />
    </div>
  )
}
