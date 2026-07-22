import Link from "next/link"
import { Tv, Bot, Palette, BookOpen, Gamepad2, Globe } from "lucide-react"

const categories = [
  {
    name: "Streaming",
    slug: "streaming",
    icon: Tv,
    desc: "Netflix, Spotify, Disney+",
    gradient: "from-[#595B83] to-[#333456]",
  },
  {
    name: "AI Tools",
    slug: "ai",
    icon: Bot,
    desc: "ChatGPT, Midjourney, Gemini",
    gradient: "from-[#F4ABC4] to-[#595B83]",
  },
  {
    name: "Design",
    slug: "design",
    icon: Palette,
    desc: "Canva, Adobe CC, Figma",
    gradient: "from-[#333456] to-[#595B83]",
  },
  {
    name: "Edukasi",
    slug: "education",
    icon: BookOpen,
    desc: "Duolingo, Coursera, Skillshare",
    gradient: "from-[#595B83] to-[#F4ABC4]",
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: Gamepad2,
    desc: "Xbox, PlayStation, Steam",
    gradient: "from-[#333456] to-[#F4ABC4]",
  },
  {
    name: "Lainnya",
    slug: "",
    icon: Globe,
    desc: "VPN, Cloud Storage, dan lainnya",
    gradient: "from-[#595B83] to-[#333456]",
  },
]

interface CategorySectionProps {
  categoryCounts?: Record<string, number>
}

export default function CategorySection({ categoryCounts }: CategorySectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-display-xl mb-3">Jelajahi Kategori</h2>
        <p className="text-body-md text-muted max-w-md mx-auto">
          Pilih kategori layanan yang kamu butuhkan
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat, i) => {
          const Icon = cat.icon
          const href = cat.slug ? `/products?category=${cat.slug}` : "/products"
          const count = cat.slug ? (categoryCounts?.[cat.slug] ?? null) : null
          return (
            <Link
              key={cat.name}
              href={href}
              className="group flex flex-col items-center gap-3 p-5 rounded-lg border border-hairline bg-canvas hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 text-center"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-title-sm">{cat.name}</p>
                <p className="text-body-sm text-muted mt-0.5 line-clamp-2 leading-tight">
                  {cat.desc}
                </p>
                {count !== null && (
                  <p className="text-caption text-primary font-medium mt-1">{count} produk</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}