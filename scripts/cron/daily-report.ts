/**
 * Daily Report Cron Job
 * Sends daily summary to admin at 08:00
 */

import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

async function main() {
  console.log("[DailyReport] Generating daily report...")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get today's stats
  const [ordersToday, revenueToday, claimsToday, newWarranties] = await Promise.all([
    db.order.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    db.order.aggregate({
      where: { 
        createdAt: { gte: today, lt: tomorrow },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    }),
    db.warrantyClaim.count({
      where: { submittedAt: { gte: today, lt: tomorrow } },
    }),
    db.warranty.count({
      where: { startDate: { gte: today, lt: tomorrow } },
    }),
  ])

  const revenue = revenueToday._sum.total || 0
  const message =
    `📊 <b>Daily Report</b>\n` +
    `Date: ${today.toLocaleDateString("id-ID")}\n` +
    `Orders: ${ordersToday}\n` +
    `Revenue: Rp ${revenue.toLocaleString("id-ID")}\n` +
    `Warranty Claims: ${claimsToday}\n` +
    `New Warranties: ${newWarranties}`

  console.log("[DailyReport]", message)
  await sendTelegramNotification(message)
}

main()