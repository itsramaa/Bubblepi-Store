import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category")
  const excludeId = request.nextUrl.searchParams.get("excludeId")

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
      ...(excludeId && { id: { not: excludeId } }),
    },
    include: {
      variants: {
        where: { stock: { some: { status: "AVAILABLE" } } },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    take: 2,
  })

  return NextResponse.json({ products: products.filter((p) => p.variants.length > 0) })
}
