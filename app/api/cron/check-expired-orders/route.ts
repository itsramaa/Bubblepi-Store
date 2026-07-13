import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendOrderExpired } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request)
  if (cronError) return cronError

  const expiredAt = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago

  // Fetch orders before updating so we can send emails
  const expiredOrders = await db.order.findMany({
    where: {
      status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      createdAt: { lt: expiredAt },
    },
    select: { id: true, customerEmail: true, customerName: true, orderNumber: true },
  })

  const result = await db.order.updateMany({
    where: {
      status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      createdAt: { lt: expiredAt },
    },
    data: { status: "FAILED" },
  })

  // Send expiry notifications (fire-and-forget)
  for (const order of expiredOrders) {
    sendOrderExpired({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
    }).catch((err) => console.error(`[check-expired-orders] Email failed for ${order.orderNumber}:`, err))
  }

  return NextResponse.json({ expired: result.count })
}
