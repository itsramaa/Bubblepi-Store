import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"
import { z } from "zod"

const schema = z.object({
  orderId: z.string().cuid(),
  orderItemId: z.string().cuid(),
  description: z.string().min(10).max(1000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderItemId, description } = schema.parse(body)

    const order = await db.order.findUnique({ where: { id: orderId }, select: { orderNumber: true, customerEmail: true } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const existing = await db.warrantyClaim.findFirst({ where: { orderId, orderItemId } })
    if (existing) return NextResponse.json({ error: "Klaim sudah pernah diajukan untuk item ini" }, { status: 409 })

    const claim = await db.warrantyClaim.create({ data: { orderId, orderItemId, description } })

    await sendTelegramNotification(
      `🛡️ <b>Klaim Garansi Baru</b>
Order: #${order.orderNumber}
Email: ${order.customerEmail}
Deskripsi: ${description.slice(0, 100)}`
    )

    return NextResponse.json({ success: true, claim }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })
  const claims = await db.warrantyClaim.findMany({ where: { orderId }, orderBy: { createdAt: "desc" } })
  return NextResponse.json({ claims })
}
