"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HeroSection() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#060930] via-[#333456] to-[#595B83]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#F4ABC4]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#595B83]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-[#F4ABC4] animate-pulse" />
          Premium digital accounts marketplace
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Akun Digital Premium
          <br />
          <span className="bg-gradient-to-r from-[#F4ABC4] to-[#e889a6] bg-clip-text text-transparent">
            Harga Merakyat
          </span>
        </h1>

        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Netflix, Spotify, Canva, ChatGPT — semua akun premium sharing & private.
          Langsung aktif, tanpa ribet.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari produk... Netflix, Spotify, dll"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-13 rounded-xl bg-white text-foreground border-0 text-base shadow-lg"
            />
          </div>
          <Button type="submit" className="h-13 px-6 rounded-xl bg-[#F4ABC4] text-[#060930] hover:bg-[#e889a6] font-semibold shadow-lg">
            <Search className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Cari</span>
          </Button>
        </form>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-8 mt-12 text-white/50 text-sm">
          <span>⚡ Instant delivery</span>
          <span>🔒 Aman & terpercaya</span>
          <span>💬 Support 24/7</span>
        </div>
      </div>
    </section>
  )
}
