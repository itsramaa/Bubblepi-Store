/**
 * Price Sync Cron Job
 * Syncs prices from Google Sheets every 2 hours
 */

import { syncFromSheet } from "@/lib/sync/sheets"
import { sendTelegramNotification } from "@/lib/telegram"

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const sheetRange = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:D"

  if (!spreadsheetId) {
    console.log("GOOGLE_SHEET_ID not configured, skipping sync")
    process.exit(0)
  }

  console.log("[PriceSync] Starting price sync from Google Sheets...")

  try {
    const result = await syncFromSheet(spreadsheetId, sheetRange)

    if (result.errors.length > 0) {
      await sendTelegramNotification(
        `⚠️ <b>Price Sync Errors</b>\n` +
        `Products: ${result.products}, Variants: ${result.variants}\n` +
        `Errors: ${result.errors.join(", ")}`
      )
    } else {
      console.log(`[PriceSync] Synced ${result.products} products, ${result.variants} variants`)
    }
  } catch (error) {
    console.error("[PriceSync] Failed:", error)
    await sendTelegramNotification(
      `❌ <b>Price Sync Failed</b>\n${error}`
    )
  }
}

main()