import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const where = status ? { status: status as never } : {}

  const orders = await db.order.findMany({
    where,
    include: { items: { include: { variant: { include: { product: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: orders })
}
