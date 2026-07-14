import { Suspense } from "react"
import { db } from "@/lib/db"
import HeroSection from "@/components/store/HeroSection"
import FeaturedProducts from "@/components/store/FeaturedProducts"
import HowItWorks from "@/components/store/HowItWorks"
import CategorySection from "@/components/store/CategorySection"
import { LiveFulfillmentBadge } from "@/components/store/LiveFulfillmentBadge"
import FAQSection from "@/components/store/FAQSection"
import SocialProofBanner from "@/components/store/SocialProofBanner"
import TestimonialsSection from "@/components/store/TestimonialsSection"
import Footer from "@/components/store/Footer"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [rawProducts, categoryCounts, soldCounts, socialStats] = await Promise.all([
    // Products sorted by totalSold via orderItems aggregate
    db.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      take: 6,
    }),
    db.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { id: true },
    }),
    // Count fulfilled orderItems per product via variant relation
    db.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: { order: { status: "FULFILLED" } },
    }),
    // Social proof stats for hero badges
    db.order.aggregate({
      _count: { id: true },
      where: { status: "FULFILLED" },
    }),
  ])

  // Build variantId → sold map
  const variantSoldMap = new Map<string, number>(
    soldCounts.map((s) => [s.variantId, s._sum.quantity ?? 0])
  )

  // Attach totalSold to each product (sum across all its variants)
  const products = rawProducts
    .map((p) => ({
      ...p,
      totalSold: p.variants.reduce(
        (sum, v) => sum + (variantSoldMap.get(v.id) ?? 0),
        0
      ),
    }))
    .sort((a, b) => b.totalSold - a.totalSold)

  const totalStoreSold = socialStats._count.id

  const categoryCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count.id])
  )

  // Pass totalBuyers to HeroSection for live trust badges
  const totalBuyers = totalStoreSold

  return (
    <div>
      <HeroSection totalBuyers={totalBuyers} totalSold={totalStoreSold} />
      <SocialProofBanner />
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <FeaturedProducts products={products} totalStoreSold={totalStoreSold} />
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
