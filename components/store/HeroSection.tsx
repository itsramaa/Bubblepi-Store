"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, Zap, Star } from "lucide-react"
import { useRouter } from "next/navigation"

const PLACEHOLDERS = [
  "Cari Netflix...",
  "Cari Spotify...",
  "Cari ChatGPT...",
  "Cari Canva Pro...",
  "Cari YouTube Premium...",
]

const FLOATING_BADGES = [
  { label: "Netflix", emoji: "🎬", side: "left", delay: "0s" },
  { label: "Spotify", emoji: "🎵", side: "left", delay: "0.4s" },
  { label: "ChatGPT", emoji: "🤖", side: "right", delay: "0.2s" },
  { label: "Canva Pro", emoji: "🎨", side: "right", delay: "0.6s" },
]

interface HeroSectionProps {
  totalBuyers?: number
  totalSold?: number
}

export default function HeroSection({ totalBuyers, totalSold }: HeroSectionProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  // Typewriter placeholder
  const [placeholderText, setPlaceholderText] = useState("")
  const [phIndex, setPhIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const target = PLACEHOLDERS[phIndex]
    if (!deleting && charIndex < target.length) {
      timerRef.current = setTimeout(() => {
        setPlaceholderText(target.slice(0, charIndex + 1))
        setCharIndex((c) => c + 1)
      }, 60)
    } else if (!deleting && charIndex === target.length) {
      timerRef.current = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && charIndex > 0) {
      timerRef.current = setTimeout(() => {
        setPlaceholderText(target.slice(0, charIndex - 1))
        setCharIndex((c) => c - 1)
      }, 35)
    } else if (deleting && charIndex === 0) {
      setDeleting(false)
      setPhIndex((i) => (i + 1) % PLACEHOLDERS.length)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [charIndex, deleting, phIndex])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search.trim())}`)
    else router.push("/products")
  }

  const buyersDisplay = totalBuyers ? `${totalBuyers.toLocaleString("id-ID")}+` : "500+"
  const soldDisplay = totalSold ? `${totalSold.toLocaleString("id-ID")}+` : null

  const trustBadges = [
    { icon: Star, text: `${buyersDisplay} pembeli puas` },
    { icon: Zap, text: "Fulfilled < 5 menit" },
    { icon: Shield, text: "Garansi resmi" },
    ...(soldDisplay ? [{ icon: ShoppingBagIcon, text: `${soldDisplay} terjual` }] : []),
  ]

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060930] via-[#333456] to-[#595B83]" />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 60% 40%, #F4ABC4 0%, transparent 60%)",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#F4ABC4]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#595B83]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Floating product badges */}
      {FLOATING_BADGES.map((badge) => (
        <div
          key={badge.label}
          className={`absolute hidden md:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-white/90 text-sm font-medium select-none pointer-events-none`}
          style={{
            ...(badge.side === "left"
              ? { left: "calc(50% + 260px)", top: badge.delay === "0s" ? "28%" : "42%" }
              : { left: "calc(50% + 340px)", top: badge.delay === "0.2s" ? "35%" : "50%" }),
            animation: `floatBadge 3s ease-in-out infinite`,
            animationDelay: badge.delay,
          }}
        >
          <span>{badge.emoji}</span>
          <span>{badge.label}</span>
        </div>
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 text-white">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F4ABC4] animate-pulse" />
            Akun digital premium, harga terjangkau
          </div>

          {/* Headline with animated gradient */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Langganan
            <br />
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #F4ABC4 0%, #ffffff 50%, #F4ABC4 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "gradientShift 4s linear infinite",
              }}
            >
              Premium
            </span>
            <br />
            Lebih Hemat
          </h1>

          <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
            Netflix, Spotify, Canva, ChatGPT, dan 20+ layanan premium dengan harga yang bikin dompet senang.{" "}
            Proses otomatis, langsung ke email kamu.
          </p>

          {/* Search bar with typewriter placeholder */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholderText || "Cari produk..."}
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

      {/* Keyframe styles */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  )
}

// Inline mini icon to avoid import
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" x2="21" y1="6" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
