import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-callback-token")
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
    if (webhookToken && token !== webhookToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { external_id, status } = body

    const order = await db.order.findFirst({
      where: { orderNumber: external_id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (status === "PAID") {
      // Idempotency: skip if already PAID or FULFILLED
      if (order.status === "PAID" || order.status === "FULFILLED") {
        return NextResponse.json({ success: true, skipped: true })
      }
      await db.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      })
      await fulfillOrder(order.id)
    } else if (status === "EXPIRED" || status === "FAILED") {
      // AWAITING_PAYMENT adalah status setelah createInvoice — bukan PENDING
      if (order.status === "AWAITING_PAYMENT" || order.status === "PENDING") {
        await db.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
