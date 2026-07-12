import { db } from "@/lib/db"
import HeroSection from "@/components/store/HeroSection"
import FeaturedProducts from "@/components/store/FeaturedProducts"
import HowItWorks from "@/components/store/HowItWorks"
import CategorySection from "@/components/store/CategorySection"
import FAQSection from "@/components/store/FAQSection"
import SocialProofBanner from "@/components/store/SocialProofBanner"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    take: 6,
  })

  return (
    <div>
      <HeroSection />
      <SocialProofBanner />
      <FeaturedProducts products={products} />
      <HowItWorks />
      <CategorySection />
      <FAQSection />
    </div>
  )
}
