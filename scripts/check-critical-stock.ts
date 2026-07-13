import { prisma, notify } from "./_common"
import { sendTelegramNotification } from "../lib/telegram"

// Called after fulfillOrder to check critical stock
export async function checkCriticalStock(variantId: string) {
  const count = await prisma.accountStock.count({
    where: { variantId, status: "AVAILABLE" },
  })
  if (count < 5) {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true } } },
    })
    if (variant) {
      await sendTelegramNotification(
        `⚠️ <b>Stok Kritis!</b>\n` +
        `${variant.product.name} — ${variant.name}\n` +
        `Sisa: <b>${count} unit</b>`
      ).catch(() => {})
    }
  }
}
