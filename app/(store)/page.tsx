import { db } from "@/lib/db"
import HeroSection from "@/components/store/HeroSection"
import FeaturedProducts from "@/components/store/FeaturedProducts"
import HowItWorks from "@/components/store/HowItWorks"
import CategorySection from "@/components/store/CategorySection"
import { LiveFulfillmentBadge } from "@/components/store/LiveFulfillmentBadge"
import FAQSection from "@/components/store/FAQSection"
import SocialProofBanner from "@/components/store/SocialProofBanner"
import TestimonialsSection from "@/components/store/TestimonialsSection"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [products, categoryCounts] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    db.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { id: true },
    }),
  ])

  const categoryCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count.id])
  )

  return (
    <div>
      <HeroSection />
      <SocialProofBanner />
      <FeaturedProducts products={products} />
      <HowItWorks />
      <LiveFulfillmentBadge />
      <CategorySection categoryCounts={categoryCountMap} />
      <TestimonialsSection />
      <FAQSection />
    </div>
  )
}
