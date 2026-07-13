"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface CategoryOption {
  slug: string
  name: string
  emoji: string
}

const CATEGORY_META: Record<string, { name: string; emoji: string }> = {
  "": { name: "Semua Produk", emoji: "🛍️" },
  streaming: { name: "Streaming", emoji: "📺" },
  ai: { name: "AI", emoji: "🤖" },
  design: { name: "Design", emoji: "🎨" },
  education: { name: "Pendidikan", emoji: "📚" },
  gaming: { name: "Gaming", emoji: "🎮" },
}

interface FilterSidebarProps {
  categories?: string[]
}

export default function FilterSidebar({ categories = [] }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category") || ""
  const currentSort = searchParams.get("sort") || ""
  const [search, setSearch] = useState(searchParams.get("search") || "")

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate(currentCategory, search, currentSort)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function navigate(category: string, q?: string, sort?: string) {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (q ?? search) params.set("search", q ?? search)
    if (sort) params.set("sort", sort)
    router.replace(`/products${params.toString() ? `?${params}` : ""}`, { scroll: false })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(currentCategory, search, currentSort)
  }

  function handleSort(value: string | null) {
    navigate(currentCategory, search, value ?? "")
  }

  // Build category list: always include "Semua", then dynamic ones from DB
  const categoryOptions: CategoryOption[] = [
    { slug: "", name: "Semua Produk", emoji: "🛍️" },
    ...categories.map((slug) => ({
      slug,
      name: CATEGORY_META[slug]?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1),
      emoji: CATEGORY_META[slug]?.emoji ?? "📦",
    })),
  ]

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

        {/* Sort */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Urutkan
          </p>
          <Select value={currentSort} onValueChange={handleSort}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Default</SelectItem>
              <SelectItem value="price_asc">Harga termurah</SelectItem>
              <SelectItem value="price_desc">Harga termahal</SelectItem>
              <SelectItem value="popular">Terlaris</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3" />
            Kategori
          </p>
          <div className="flex flex-wrap md:flex-col gap-2">
            {categoryOptions.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => navigate(cat.slug, search, currentSort)}
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
