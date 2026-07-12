import { db } from "@/lib/db"
import HeroCarousel from "@/components/store/HeroCarousel"
import FeaturedProducts from "@/components/store/FeaturedProducts"
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
      <HeroCarousel />
      <FeaturedProducts products={products} />
      <CategorySection />
      <TestimonialsSection />
      <FAQSection />
    </div>
  )
}
