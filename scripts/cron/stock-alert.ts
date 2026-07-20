/**
 * Stock Alert Cron Job
 * Checks for critical stock levels and notifies admin
 */

import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

const CRITICAL_STOCK_THRESHOLD = 3

async function main() {
  console.log("[StockAlert] Checking critical stock levels...")

  // Get variants with low stock
  const lowStockVariants = await db.variant.findMany({
    include: {
      product: true,
      stocks: {
        where: { status: "AVAILABLE" },
      },
    },
  })

  const critical: string[] = []

  for (const variant of lowStockVariants) {
    const availableCount = variant.stocks.length
    if (availableCount <= CRITICAL_STOCK_THRESHOLD) {
      critical.push(
        `${variant.product.name} - ${variant.name}: ${availableCount} stock`
      )
    }
  }

  if (critical.length > 0) {
    const message =
      `⚠️ <b>Critical Stock Alert</b>\n` +
      critical.join("\n")

    console.log("[StockAlert]", message)
    await sendTelegramNotification(message)
  } else {
    console.log("[StockAlert] All stock levels OK")
  }
}

main()