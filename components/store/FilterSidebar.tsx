"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

const categories = [
  { name: "Semua", slug: "" },
  { name: "Streaming", slug: "streaming" },
  { name: "AI", slug: "ai" },
  { name: "Design", slug: "design" },
]

export default function FilterSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category") || ""
  const [search, setSearch] = useState(searchParams.get("search") || "")

  function handleCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category) params.set("category", category)
    else params.delete("category")
    router.push(`/products?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set("search", search)
    else params.delete("search")
    router.push(`/products?${params.toString()}`)
  }

  return (
    <aside className="w-64 shrink-0">
      <form onSubmit={handleSearch} className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </form>
      <div className="space-y-1">
        {categories.map((cat) => (
          <Button
            key={cat.slug}
            variant={currentCategory === cat.slug ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleCategory(cat.slug)}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </aside>
  )
}
