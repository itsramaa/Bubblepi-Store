import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export async function checkCriticalStock(variantId: string) {
  const count = await db.accountStock.count({
    where: { variantId, status: "AVAILABLE" },
  })

  if (count < 5) {
    const variant = await db.variant.findUnique({
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
