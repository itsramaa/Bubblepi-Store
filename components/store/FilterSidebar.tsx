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
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react"
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
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const inStock = searchParams.get("inStock") === "1"
  const [sheetOpen, setSheetOpen] = useState(false)

  const hasActiveFilters = currentCategory || currentSort || search || minPrice || maxPrice || inStock

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

  function navigate(
    category: string,
    q?: string,
    sort?: string,
    overrides?: { minPrice?: string; maxPrice?: string; inStock?: string }
  ) {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (q ?? search) params.set("search", q ?? search)
    if (sort) params.set("sort", sort)
    if (overrides?.minPrice) params.set("minPrice", overrides.minPrice)
    else if (minPrice) params.set("minPrice", minPrice)
    if (overrides?.maxPrice) params.set("maxPrice", overrides.maxPrice)
    else if (maxPrice) params.set("maxPrice", maxPrice)
    const stockVal = overrides?.inStock !== undefined ? overrides.inStock : inStock ? "1" : ""
    if (stockVal) params.set("inStock", stockVal)
    router.replace(`/products${params.toString() ? `?${params}` : ""}`, { scroll: false })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(currentCategory, search, currentSort)
  }

  function handleSort(value: string | null) {
    navigate(currentCategory, search, value ?? "")
  }

  function resetAllFilters() {
    setMinPrice("")
    setMaxPrice("")
    setSearch("")
    router.replace("/products", { scroll: false })
  }

  function handlePriceApply() {
    navigate(currentCategory, search, currentSort, { minPrice, maxPrice })
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

  const filterContent = (
    <div className="space-y-4">
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

      {/* Price Range */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Rentang Harga
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min (Rp)"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="text-xs"
            min={0}
          />
          <span className="text-muted-foreground text-xs">—</span>
          <Input
            type="number"
            placeholder="Max (Rp)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="text-xs"
            min={0}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={handlePriceApply}
        >
          Terapkan Harga
        </Button>
      </div>

      {/* In Stock Toggle */}
      <div className="flex items-center justify-between">
        <label htmlFor="inStock-toggle" className="text-sm text-muted-foreground">
          Hanya tampilkan yang tersedia
        </label>
        <Switch
          id="inStock-toggle"
          checked={inStock}
          onCheckedChange={(checked) =>
            navigate(currentCategory, search, currentSort, {
              inStock: checked ? "1" : "",
            })
          }
        />
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={resetAllFilters}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset semua filter
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: Sheet with filter button */}
      <div className="md:hidden mb-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                !
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="left" className="p-4 overflow-y-auto">
            <SheetHeader className="p-0">
              <SheetTitle>Filter Produk</SheetTitle>
            </SheetHeader>
            <div className="mt-2">{filterContent}</div>
            <div className="pt-4">
              <SheetClose render={<Button className="w-full" />}>
                Tampilkan Hasil
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: inline sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="md:sticky md:top-24">{filterContent}</div>
      </aside>
    </>
  )
}
