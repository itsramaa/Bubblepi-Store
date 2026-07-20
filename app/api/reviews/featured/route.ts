import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { isVisible: true, rating: { gte: 4 } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
    })

    return NextResponse.json(
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user?.name ?? "Customer",
        createdAt: r.createdAt,
        productName: r.product?.name ?? null,
      }))
    )
  } catch (error) {
    console.error("Featured reviews error:", error)
    return NextResponse.json([])
  }
}
