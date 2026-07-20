import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"
import { decrypt, isEncrypted } from "@/lib/crypto"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { variant: { include: { product: true } } } }, stocks: true },
  })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (order.status !== "DELIVERED") return NextResponse.json({ error: "Order belum delivered" }, { status: 400 })

  await sendAccountDelivery({
    to: order.guestEmail ?? "unknown@email.com",
    orderNumber: order.orderNumber,
    orderId: id,
    items: order.items.map((item) => ({
      name: item.variant.product.name + " (" + item.variant.name + ")",
      credentials: order.stocks
        .filter((s) => s.variantId === item.variantId)
        .map((s) => (isEncrypted(s.credentials) ? decrypt(s.credentials) : s.credentials)),
    })),
  })

  return NextResponse.json({ success: true })
}