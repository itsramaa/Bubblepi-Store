import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"
import { sendTelegramNotification } from "@/lib/telegram"

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
      const stock = await db.accountStock.findFirst({
        where: {
          variantId: item.variantId,
          status: "AVAILABLE",
        },
        orderBy: { createdAt: "asc" },
      })

      if (!stock) {
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

      await db.accountStock.update({
        where: { id: stock.id },
        data: {
          status: "ASSIGNED",
          orderId: orderId,
          assignedAt: new Date(),
        },
      })

      credentialsList.push(stock.credentials)
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
        // Only set paidAt if not already set by webhook
        ...(order.paidAt ? {} : { paidAt: new Date() }),
      },
    })

    // Update stock from ASSIGNED → DELIVERED
    await db.accountStock.updateMany({
      where: { orderId: orderId, status: "ASSIGNED" },
      data: { status: "DELIVERED" },
    })

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
