"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

const categories = [
  { name: "Streaming", slug: "streaming", emoji: "📺", desc: "Netflix, Spotify, Disney+", color: "from-red-500 to-red-700" },
  { name: "AI", slug: "ai", emoji: "🤖", desc: "ChatGPT, Midjourney, Gemini", color: "from-emerald-500 to-emerald-700" },
  { name: "Design", slug: "design", emoji: "🎨", desc: "Canva, Adobe CC, Figma", color: "from-violet-500 to-violet-700" },
]

export default function CategorySection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold">Kategori Produk</h2>
        <p className="text-muted-foreground mt-2">Pilih kategori sesuai kebutuhan kamu</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br text-white cursor-pointer transition-transform hover:scale-105 hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90`} />
            <div className="relative z-10">
              <span className="text-5xl block mb-4">{cat.emoji}</span>
              <h3 className="text-xl font-bold mb-1">{cat.name}</h3>
              <p className="text-white/70 text-sm">{cat.desc}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
          </Link>
        ))}
      </div>
    </section>
  )
}
