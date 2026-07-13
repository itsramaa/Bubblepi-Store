"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, Zap, Star } from "lucide-react"
import { useRouter } from "next/navigation"

const trustBadges = [
  { icon: Star, text: "500+ pembeli puas" },
  { icon: Zap, text: "Fulfilled < 5 menit" },
  { icon: Shield, text: "Garansi resmi" },
]

export default function HeroSection() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search.trim())}`)
    else router.push("/products")
  }

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060930] via-[#333456] to-[#595B83]" />

      {/* Decorative blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#F4ABC4]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#595B83]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 text-white">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F4ABC4] animate-pulse" />
            Akun digital premium, harga terjangkau
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Langganan
            <br />
            <span className="text-[#F4ABC4]">Premium</span>
            <br />
            Lebih Hemat
          </h1>

          <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
            Netflix, Spotify, Canva, ChatGPT, dan 20+ layanan premium dengan harga yang bikin dompet senang. 
            Proses otomatis, langsung ke email kamu.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Netflix, Spotify, Canva..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/40 h-12"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="bg-[#F4ABC4] text-[#333456] hover:bg-[#F4ABC4]/90 font-semibold h-12 px-6 shrink-0"
            >
              Cari
            </Button>
          </form>

          {/* Secondary CTA */}
          <div className="mb-10">
            <Link
              href="/products?sort=terlaris"
              className="inline-flex items-center gap-1 border border-white/30 text-white/80 hover:text-white hover:border-white/60 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors backdrop-blur-sm bg-white/5 hover:bg-white/10"
            >
              Lihat Produk Terlaris →
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4">
            {trustBadges.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-white/70">
                <Icon className="h-4 w-4 text-[#F4ABC4]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
