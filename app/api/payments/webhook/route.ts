import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { sendPaymentReceived, sendOrderExpired } from "@/lib/mailer"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-callback-token")
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
    if (!webhookToken || token !== webhookToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rl = checkRateLimit(`webhook:${ip}`, 100, 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
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
      // Idempotency: skip if already PAID or DELIVERED
      if (order.status === "PAID" || order.status === "DELIVERED") {
        return NextResponse.json({ success: true, skipped: true })
      }

      await db.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      })

      // Track payment funnel events (fire-and-forget)
      db.funnelEvent.create({
        data: { sessionId: `order:${order.id}`, event: "PAYMENT_INITIATED" },
      }).catch(() => {})

      sendPaymentReceived({
        to: order.guestEmail ?? "unknown@email.com",
        customerName: order.guestName ?? "Customer",
        orderNumber: order.orderNumber,
        orderId: order.id,
      }).catch(async (err) => {
        console.error("sendPaymentReceived failed:", err)
        await db.order
          // Resend count tracking removed
      })

      await fulfillOrder(order.id)

      db.funnelEvent.create({
        data: { sessionId: `order:${order.id}`, event: "PAYMENT_SUCCESS" },
      }).catch(() => {})
    } else if (status === "EXPIRED" || status === "FAILED") {
      // AWAITING_PAYMENT adalah status setelah createInvoice
      if (order.status === "AWAITING_PAYMENT" || order.status === "PENDING") {
        await db.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        })
      }

      sendOrderExpired({
        to: order.guestEmail ?? "unknown@email.com",
        customerName: order.guestName ?? "Customer",
        orderNumber: order.orderNumber,
      }).catch(async (err) => {
        console.error("sendOrderExpired failed:", err)
        await db.order
          // Resend count tracking removed
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
