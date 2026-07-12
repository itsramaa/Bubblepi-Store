import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stockItemSchema } from "@/lib/validators"

export async function GET() {
  const stock = await db.accountStock.findMany({
    include: { variant: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: stock })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = stockItemSchema.parse(body)
    const expiresAt = (parsed as any).expiresAt
    const item = await db.accountStock.create({
      data: {
        variantId: parsed.variantId,
        credentials: parsed.credentials,
        expiresAt: expiresAt ? new Date(expiresAt as string) : null,
      },
    })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
