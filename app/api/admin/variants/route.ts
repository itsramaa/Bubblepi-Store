import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { variantSchema } from "@/lib/validators"

export async function GET() {
  const variants = await db.variant.findMany({
    include: { product: { select: { name: true, slug: true } }, stock: true },
  })
  return NextResponse.json({ success: true, data: variants })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = variantSchema.parse(body)
    const variant = await db.variant.create({ data: parsed })
    return NextResponse.json({ success: true, data: variant }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
