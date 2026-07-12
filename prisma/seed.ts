import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const products = [
  {
    name: "Netflix",
    slug: "netflix",
    description: "Akses streaming Netflix premium dengan harga terjangkau.",
    image: "/images/products/netflix.jpg",
    category: "streaming",
    variants: [
      { name: "1P 2U", duration: "1 Bulan", price: 20000 },
      { name: "1P 1U", duration: "1 Bulan", price: 25000 },
      { name: "Private", duration: "1 Bulan", price: 110000 },
    ],
  },
  {
    name: "Canva",
    slug: "canva",
    description: "Canva Pro untuk desain profesional.",
    image: "/images/products/canva.jpg",
    category: "design",
    variants: [
      { name: "Invite", duration: "1 Bulan", price: 5000 },
      { name: "Private", duration: "1 Bulan", price: 10000 },
    ],
  },
  {
    name: "ChatGPT",
    slug: "chatgpt",
    description: "ChatGPT Plus untuk produktivitas maksimal.",
    image: "/images/products/chatgpt.jpg",
    category: "ai",
    variants: [
      { name: "Sharing", duration: "1 Bulan", price: 50000 },
    ],
  },
  {
    name: "Spotify",
    slug: "spotify",
    description: "Spotify Premium tanpa iklan.",
    image: "/images/products/spotify.jpg",
    category: "streaming",
    variants: [
      { name: "Family", duration: "1 Bulan", price: 15000 },
      { name: "Individual", duration: "1 Bulan", price: 25000 },
    ],
  },
  {
    name: "Adobe Creative Cloud",
    slug: "adobe-creative-cloud",
    description: "Akses lengkap Adobe Creative Cloud.",
    image: "/images/products/adobe.jpg",
    category: "design",
    variants: [
      { name: "Photography", duration: "1 Bulan", price: 30000 },
      { name: "Complete", duration: "1 Bulan", price: 75000 },
    ],
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    description: "Midjourney AI untuk generasi gambar.",
    image: "/images/products/midjourney.jpg",
    category: "ai",
    variants: [
      { name: "Basic", duration: "1 Bulan", price: 45000 },
      { name: "Standard", duration: "1 Bulan", price: 65000 },
    ],
  },
]

async function main() {
  console.log("Seeding database...")
  for (const product of products) {
    const { variants, ...productData } = product
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        variants: {
          create: variants,
        },
      },
    })
    console.log(`✓ ${productData.name}`)
  }
  console.log("Seed selesai.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
