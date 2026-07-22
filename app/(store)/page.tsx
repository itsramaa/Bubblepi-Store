import { Suspense } from "react"
import { fetchFromGo, parseJson } from "@/lib/api-client"
import HeroSection from "@/components/store/HeroSection"
import FeaturedProducts from "@/components/store/FeaturedProducts"
import HowItWorks from "@/components/store/HowItWorks"
import CategorySection from "@/components/store/CategorySection"
import { LiveFulfillmentBadge } from "@/components/store/LiveFulfillmentBadge"
import FAQSection from "@/components/store/FAQSection"
import SocialProofBanner from "@/components/store/SocialProofBanner"
import TestimonialsSection from "@/components/store/TestimonialsSection"
import Footer from "@/components/store/Footer"
import type { ProductDetail } from "@/types"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [productsRes, socialRes] = await Promise.all([
    fetchFromGo("/products"),
    fetchFromGo("/stats/social-proof"),
  ])
  const productsJson = await parseJson<ProductDetail[]>(productsRes)
  const social = await parseJson<{ totalOrders: number; totalTestimonials: number; averageRating: number }>(socialRes)

  const rawProducts = productsJson.filter((p) => p.isActive).slice(0, 6)

  // Social proof
  const totalStoreSold = social.totalOrders
  const totalBuyers = totalStoreSold

  // Category counts from product list
  const categoryCountMap: Record<string, number> = {}
  for (const p of productsJson) {
    if (p.category) categoryCountMap[p.category] = (categoryCountMap[p.category] ?? 0) + 1
  }

  return (
    <div>
      <HeroSection totalBuyers={totalBuyers} totalSold={totalStoreSold} />
      <SocialProofBanner />
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <FeaturedProducts products={rawProducts} totalStoreSold={totalStoreSold} />
      </Suspense>
      <HowItWorks />
      <LiveFulfillmentBadge />
      <CategorySection categoryCounts={categoryCountMap} />
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <FAQSection />
      </Suspense>
      <Footer />
    </div>
  )
}
