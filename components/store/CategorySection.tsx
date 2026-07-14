import Link from "next/link"
import { Tv, Bot, Palette, BookOpen, Gamepad2, Globe } from "lucide-react"

const categories = [
  {
    name: "Streaming",
    slug: "streaming",
    icon: Tv,
    desc: "Netflix, Spotify, Disney+",
    gradient: "from-red-500 to-rose-600",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  {
    name: "AI Tools",
    slug: "ai",
    icon: Bot,
    desc: "ChatGPT, Midjourney, Gemini",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    name: "Design",
    slug: "design",
    icon: Palette,
    desc: "Canva, Adobe CC, Figma",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    name: "Edukasi",
    slug: "education",
    icon: BookOpen,
    desc: "Duolingo, Coursera, Skillshare",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: Gamepad2,
    desc: "Xbox, PlayStation, Steam",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    name: "Lainnya",
    slug: "",
    icon: Globe,
    desc: "VPN, Cloud Storage, dan lainnya",
    gradient: "from-[#595B83] to-[#F4ABC4]",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
]

interface CategorySectionProps {
  categoryCounts?: Record<string, number>
}

export default function CategorySection({ categoryCounts }: CategorySectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Jelajahi Kategori</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
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
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center animate-[fadeSlideUp_0.5s_ease-out_both]"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center group-hover:scale-125 group-hover:-rotate-3 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                  {cat.desc}
                </p>
                {count !== null && (
                  <p className="text-xs text-primary font-medium mt-1">{count} produk</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
