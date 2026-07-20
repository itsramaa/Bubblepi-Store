/**
 * Warranty Expiry Cron Job
 * Checks for expired warranties and updates status
 */

import { processExpiredWarranties, processExpiredProofImages } from "@/lib/warranty"
import { sendTelegramNotification } from "@/lib/telegram"

async function main() {
  console.log("[WarrantyExpiry] Checking expired warranties...")

  // Process expired warranty periods
  const expiredWarranties = await processExpiredWarranties()
  console.log(`[WarrantyExpiry] Expired ${expiredWarranties} warranties`)

  // Process expired proof images
  const expiredProofs = await processExpiredProofImages()
  console.log(`[WarrantyExpiry] Expired ${expiredProofs} proof images`)

  if (expiredWarranties > 0 || expiredProofs > 0) {
    await sendTelegramNotification(
      `🛡️ <b>Warranty Cleanup</b>\n` +
      `Expired warranties: ${expiredWarranties}\n` +
      `Expired proofs: ${expiredProofs}`
    )
  }
}

main()