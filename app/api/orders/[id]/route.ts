import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { variant: { include: { product: true } } } },
      stocks: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
  }

  // Get email: user.email OR guestEmail
  const email = order.user?.email ?? order.guestEmail ?? ""
  const name = order.user?.name ?? order.guestName ?? ""

  return NextResponse.json({
    success: true,
    data: {
      ...order,
      guestEmail: email,
      guestName: name,
    },
  })
}
