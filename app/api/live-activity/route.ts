import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const CITIES = ["Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Bali", "Makassar", "Semarang"]

function randomCity(): string {
  return CITIES[Math.floor(Math.random() * CITIES.length)]
}

export async function GET() {
  const orders = await db.order.findMany({
    where: { status: "FULFILLED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  const activities = orders
    .filter((o) => o.items.length > 0)
    .slice(0, 10)
    .map((o) => {
      const firstName = o.customerName.split(" ")[0]
      const firstItem = o.items[0]
      const productName = firstItem.variant.product.name
      return {
        firstName,
        city: randomCity(),
        productName,
      }
    })

  return NextResponse.json(activities)
}
