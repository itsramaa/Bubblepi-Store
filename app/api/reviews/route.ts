import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  productId: z.string().cuid(),
  orderId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
})

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  const reviews = await db.review.findMany({
    where: { productId, isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const avg = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0
  return NextResponse.json({ reviews, avgRating: avg })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, orderId, rating, comment } = schema.parse(body)

    // Verify buyer has FULFILLED order for this product
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        status: "FULFILLED",
        items: { some: { variant: { productId } } },
      },
    })
    if (!order) return NextResponse.json({ error: "Kamu belum pernah beli produk ini atau order belum selesai" }, { status: 403 })

    const review = await db.review.create({
      data: { productId, orderId, rating, comment },
    })
    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Kamu sudah menulis ulasan untuk produk ini" }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
