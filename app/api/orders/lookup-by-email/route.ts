import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/orders/lookup-by-email?email=xxx
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })

  const orders = await db.order.findMany({
    where: { guestEmail: email },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          variant: { select: { name: true, product: { select: { name: true } } } },
        },
      },
    },
  })

  return NextResponse.json({ orders })
}
