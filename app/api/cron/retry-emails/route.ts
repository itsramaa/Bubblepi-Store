import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"
import { decrypt, isEncrypted } from "@/lib/crypto"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request)
  if (cronError) return cronError

  // Find fulfilled orders with failed email sends (resendCount > 0, max 5 retries)
  const orders = await db.order.findMany({
    where: {
      status: "FULFILLED",
      resendCount: { gt: 0, lt: 5 },
    },
    take: 20,
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  })

  let retried = 0
  let failed = 0

  for (const order of orders) {
    try {
      // Rebuild delivered items from order items + assigned stock
      const deliveredItems: Array<{ name: string; credentials: string[] }> = []

      for (const item of order.items) {
        const stocks = await db.accountStock.findMany({
          where: { orderId: order.id, variantId: item.variantId, status: "DELIVERED" },
          select: { credentials: true },
        })
        if (stocks.length > 0) {
          deliveredItems.push({
            name: `${item.variant.product.name} - ${item.variant.name}`,
            credentials: stocks.map((s) =>
              isEncrypted(s.credentials) ? decrypt(s.credentials) : s.credentials
            ),
          })
        }
      }

      await sendAccountDelivery({
        to: order.customerEmail,
        orderNumber: order.orderNumber,
        items: deliveredItems,
        orderId: order.id,
      })

      // Reset resendCount on success
      await db.order.update({
        where: { id: order.id },
        data: { resendCount: 0 },
      })

      retried++
    } catch (err) {
      console.error(`[retry-emails] Failed for order ${order.orderNumber}:`, err)
      await db.order
        .update({
          where: { id: order.id },
          data: { resendCount: { increment: 1 } },
        })
        .catch(() => {})
      failed++
    }
  }

  return NextResponse.json({ retried, failed, total: orders.length })
}
