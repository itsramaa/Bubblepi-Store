/**
 * Testimonials API
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  const limit = parseInt(searchParams.get("limit") || "10")

  try {
    const testimonials = await db.testimonial.findMany({
      where: {
        isVisible: true,
        ...(productId && { productId }),
      },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error("[Testimonials] Error:", error)
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getUserFromSession()
  if (!user || !user.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { productId, rating, comment } = body

    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 })
    }

    const testimonial = await db.testimonial.create({
      data: {
        userId: user.userId,
        productId,
        rating,
        comment,
        isVisible: false,
        isPinned: false,
      },
    })

    return NextResponse.json(testimonial)
  } catch (error) {
    console.error("[Testimonials] Error:", error)
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 })
  }
}