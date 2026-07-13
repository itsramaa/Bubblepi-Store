"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    title: "Akun Digital Premium",
    subtitle: "Netflix, Spotify, Canva, dan lainnya",
    cta: "Lihat Produk",
    href: "/products",
    socialProof: null as string | null,
  },
  {
    title: "Harga Terjangkau",
    subtitle: "Mulai dari Rp5.000 aja!",
    cta: "Belanja Sekarang",
    href: "/products",
    socialProof: "🔥 Sudah 5.000+ pembeli puas",
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
      }, 250)
    },
    [current, isTransitioning]
  )

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      5000
    )
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center text-center px-4 transition-all duration-500 ease-in-out"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateX(20px)" : "translateX(0)",
        }}
      >
        <div key={current}>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{slide.title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            {slide.subtitle}
          </p>
          {slide.socialProof && (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-6">
              {slide.socialProof}
            </p>
          )}
          <a href={slide.href}>
            <Button size="lg">{slide.cta}</Button>
          </a>
        </div>
      </div>

      <button
        aria-label="Slide sebelumnya"
        onClick={() => changeSlide((current - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2"
      >
        <ChevronLeft className="h-8 w-8 text-muted-foreground" />
      </button>
      <button
        aria-label="Slide berikutnya"
        onClick={() => changeSlide((current + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2"
      >
        <ChevronRight className="h-8 w-8 text-muted-foreground" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            onClick={() => changeSlide(i)}
          />
        ))}
      </div>
    </div>
  )
}
