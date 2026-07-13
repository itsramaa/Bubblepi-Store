import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: "https://bubblepi-store.vercel.app", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: "https://bubblepi-store.vercel.app/products", lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: "https://bubblepi-store.vercel.app/orders", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ]

  try {
    const { db } = await import("@/lib/db")
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })

    const productPages = products.map((p) => ({
      url: `https://bubblepi-store.vercel.app/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    return [...staticPages, ...productPages]
  } catch {
    return staticPages
  }
}
