import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000)
  const cancelled = await db.order.updateMany({
    where: { status: "AWAITING_PAYMENT", createdAt: { lt: cutoff } },
    data: { status: "FAILED", cancelReason: "Invoice Xendit kedaluwarsa (auto-cancel)" },
  })
  if (cancelled.count > 0) {
    await sendTelegramNotification(`🚫 <b>Auto-Cancel</b>
${cancelled.count} order kedaluwarsa dibatalkan.`)
  }
  return NextResponse.json({ cancelled: cancelled.count })
}
