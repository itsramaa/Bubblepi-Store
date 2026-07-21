import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const products = [
  {
    name: "Netflix Premium",
    slug: "netflix",
    description: "Akses streaming Netflix premium dengan harga terjangkau.",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400",
    category: "streaming",
    variants: [
      { name: "1P 2U", price: 20000 },
      { name: "1P 1U", price: 25000 },
      { name: "Private", price: 110000 },
    ],
  },
  {
    name: "Spotify Premium",
    slug: "spotify",
    description: "Spotify Premium tanpa iklan.",
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400",
    category: "streaming",
    variants: [
      { name: "Family", price: 15000 },
      { name: "Individual", price: 25000 },
    ],
  },
  {
    name: "ChatGPT Plus",
    slug: "chatgpt-plus",
    description: "ChatGPT Plus untuk produktivitas maksimal.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    category: "ai",
    variants: [
      { name: "Bulanan", price: 50000 },
    ],
  },
  {
    name: "Canva Pro",
    slug: "canva-pro",
    description: "Canva Pro untuk desain profesional.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
    category: "design",
    variants: [
      { name: "Invite", price: 5000 },
      { name: "Private", price: 10000 },
    ],
  },
  {
    name: "Disney+ Hotstar",
    slug: "disney-hotstar",
    description: "Streaming Disney, Marvel, Star Wars dan lebih banyak.",
    image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400",
    category: "streaming",
    variants: [
      { name: "1 Bulan", price: 15000 },
      { name: "3 Bulan", price: 35000 },
    ],
  },
  {
    name: "YouTube Premium",
    slug: "youtube-premium",
    description: "YouTube tanpa iklan dan background play.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
    category: "streaming",
    variants: [
      { name: "Individual", price: 45000 },
      { name: "Family", price: 55000 },
    ],
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    description: "Midjourney AI untuk generasi gambar.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
    category: "ai",
    variants: [
      { name: "Basic", price: 45000 },
      { name: "Standard", price: 65000 },
    ],
  },
  {
    name: "Amazon Prime",
    slug: "amazon-prime",
    description: "Streaming dan delivery prime.",
    image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400",
    category: "streaming",
    variants: [
      { name: "Bulanan", price: 25000 },
    ],
  },
]

async function main() {
  console.log("🌱 Seeding database...")

  // Create supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: "default-supplier" },
    update: {},
    create: {
      id: "default-supplier",
      name: "Default Supplier",
      type: "TELEGRAM_BOT",
      isActive: true,
      priority: 1,
      config: {},
    },
  })

  for (const product of products) {
    const { variants, ...productData } = product
    const created = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        supplierId: supplier.id,
        variants: {
          create: variants.map((v) => ({ ...v, supplierVariantId: `${productData.slug}-${v.name.toLowerCase().replace(/\s/g, "-")}` })),
        },
      },
    })
    console.log(`✓ ${productData.name}`)
  }

  // Add some testimonials
  const netflix = await prisma.product.findUnique({ where: { slug: "netflix" } })
  // Testimonials - skip for now, add manually via admin or API
  // if (netflix) {
  //   await prisma.testimonial.createMany({
  //     data: [
  //       {
  //         productId: netflix.id,
  //         rating: 5,
  //         comment: "Bagus banget, langsung bisa nonton. Recommend seller ini!",
  //         isVisible: true,
  //       },
  //     ],
  //   })
  // }

  console.log("✅ Seed selesai!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })