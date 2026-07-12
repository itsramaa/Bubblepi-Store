"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const categories = [
  { name: "Streaming", slug: "streaming", emoji: "📺" },
  { name: "AI", slug: "ai", emoji: "🤖" },
  { name: "Design", slug: "design", emoji: "🎨" },
]

export default function CategorySection() {
  const router = useRouter()

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold mb-8 text-center">Kategori</h2>
      <div className="flex justify-center gap-4 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.slug}
            variant="outline"
            size="lg"
            onClick={() => router.push(`/products?category=${cat.slug}`)}
            className="text-lg gap-2"
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </Button>
        ))}
      </div>
    </section>
  )
}
