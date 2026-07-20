import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })
  }

  const orders = await db.order.findMany({
    where: { guestEmail: email.toLowerCase() },
    include: { items: { include: { variant: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const safeOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      variantName: i.variant.name,
      quantity: i.quantity,
      price: i.price,
    })),
  }))

  return NextResponse.json({ success: true, data: safeOrders })
}
