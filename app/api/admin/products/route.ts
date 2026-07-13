import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { productSchema } from "@/lib/validators"

export async function GET() {
  const products = await db.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: products })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = productSchema.parse(body)
    const product = await db.product.create({ data: parsed })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
