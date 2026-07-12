import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
import HeroSection from "@/components/store/HeroSection"
import FeaturedProducts from "@/components/store/FeaturedProducts"
import HowItWorks from "@/components/store/HowItWorks"
import CategorySection from "@/components/store/CategorySection"
import TestimonialsSection from "@/components/store/TestimonialsSection"
import FAQSection from "@/components/store/FAQSection"

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    take: 6,
  })

  return (
    <div>
      <HeroSection />
      <FeaturedProducts products={products} />
      <HowItWorks />
      <CategorySection />
      <TestimonialsSection />
      <FAQSection />
    </div>
  )
}
