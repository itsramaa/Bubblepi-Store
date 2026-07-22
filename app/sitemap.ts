import { MetadataRoute } from "next"
import { fetchFromGo, parseJson } from "@/lib/api-client"
import type { Product } from "@/types"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: "https://bubblepi-store.vercel.app", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: "https://bubblepi-store.vercel.app/products", lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: "https://bubblepi-store.vercel.app/orders", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ]

  try {
    const res = await fetchFromGo("/products")
    const products = await parseJson<Product[]>(res)

    const productPages = products.map((p) => ({
      url: `https://bubblepi-store.vercel.app/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    return [...staticPages, ...productPages]
  } catch {
    return staticPages
  }
}