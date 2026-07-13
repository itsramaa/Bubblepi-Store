import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"
import { sendTelegramNotification } from "@/lib/telegram"
import { checkCriticalStock } from "@/lib/check-critical-stock"

export async function fulfillOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!order) throw new Error("Order not found")
  if (order.status === "FULFILLED") return

  let allAssigned = true
  const deliveredItems: Array<{ name: string; credentials: string[] }> = []

  for (const item of order.items) {
    const credentialsList: string[] = []

    for (let i = 0; i < item.quantity; i++) {
      // Atomic: find + lock stock dalam satu transaction untuk cegah race condition
      const assigned = await db.$transaction(async (tx) => {
        const stock = await tx.accountStock.findFirst({
          where: { variantId: item.variantId, status: "AVAILABLE" },
          orderBy: { createdAt: "asc" },
        })
        if (!stock) return null
        return tx.accountStock.update({
          where: { id: stock.id },
          data: { status: "ASSIGNED", orderId, assignedAt: new Date() },
        })
      })

      if (!assigned) {
        allAssigned = false
        await db.order.update({
          where: { id: orderId },
          data: { status: "PENDING_STOCK" },
        })
        sendTelegramNotification(
          `⚠️ <b>Stok Kosong!</b>\n` +
          `Order: <code>${order.orderNumber}</code>\n` +
          `Variant: ${item.variant.product.name} - ${item.variant.name}\n` +
          `Menunggu stok untuk fulfillment.`
        )
        continue
      }

      credentialsList.push(assigned.credentials)
    }

    if (credentialsList.length > 0) {
      deliveredItems.push({
        name: `${item.variant.product.name} - ${item.variant.name}`,
        credentials: credentialsList,
      })
    }
  }

  if (allAssigned) {
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "FULFILLED",
        ...(order.paidAt ? {} : { paidAt: new Date() }),
      },
    })

    await db.accountStock.updateMany({
      where: { orderId, status: "ASSIGNED" },
      data: { status: "DELIVERED" },
    })

    // ponytail: referral auto-trigger butuh field refCode di Order schema — saat ini via /api/referral manual

    // Alert stok kritis setelah fulfill
    const variantIds = [...new Set(order.items.map((i) => i.variantId))]
    for (const variantId of variantIds) {
      await checkCriticalStock(variantId).catch(() => {})
    }

    await sendAccountDelivery({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      items: deliveredItems,
      orderId: order.id,
    })

    sendTelegramNotification(
      `✅ <b>Order Fulfilled!</b>\n` +
      `Order: <code>${order.orderNumber}</code>\n` +
      `Akun dikirim ke ${order.customerEmail}`
    )
  }
}
