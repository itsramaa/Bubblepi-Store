import { MetadataRoute } from "next"
import { db } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })

  const staticPages = [
    { url: "https://bubblepi-store.vercel.app", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: "https://bubblepi-store.vercel.app/products", lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: "https://bubblepi-store.vercel.app/orders", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ]

  const productPages = products.map((p) => ({
    url: `https://bubblepi-store.vercel.app/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
