"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const categories = [
  { name: "Semua Produk", slug: "", emoji: "🛍️" },
  { name: "Streaming", slug: "streaming", emoji: "📺" },
  { name: "AI", slug: "ai", emoji: "🤖" },
  { name: "Design", slug: "design", emoji: "🎨" },
]

export default function FilterSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category") || ""
  const [search, setSearch] = useState(searchParams.get("search") || "")

  function navigate(category: string, q?: string) {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (q ?? search) params.set("search", q ?? search)
    router.push(`/products${params.toString() ? `?${params}` : ""}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(currentCategory, search)
  }

  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="md:sticky md:top-24 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3" />
            Kategori
          </p>
          <div className="flex flex-wrap md:flex-col gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => navigate(cat.slug)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors",
                  currentCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
