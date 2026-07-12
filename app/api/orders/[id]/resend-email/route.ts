import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { variant: { include: { product: true } } } }, stocks: true },
  })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (order.status !== "FULFILLED") return NextResponse.json({ error: "Order belum fulfilled" }, { status: 400 })
  if (order.resendCount >= 3) return NextResponse.json({ error: "Sudah dikirim 3x, hubungi support" }, { status: 429 })

  await sendAccountDelivery({
    to: order.customerEmail,
    orderNumber: order.orderNumber,
    orderId: id,
    items: order.items.map((item) => ({
      name: item.variant.product.name + " (" + item.variant.name + ")",
      credentials: order.stocks.filter((s) => s.variantId === item.variantId).map((s) => s.credentials),
    })),
  })

  await db.order.update({ where: { id }, data: { resendCount: { increment: 1 } } })
  return NextResponse.json({ success: true })
}
