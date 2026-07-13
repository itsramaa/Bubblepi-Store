import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const cleaned = await db.order.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "FAILED", cancelReason: "Auto-cleanup: order tidak dibayar 7 hari" },
  })
  if (cleaned.count > 0) {
    await sendTelegramNotification(`🧹 <b>Auto-Cleanup</b>
${cleaned.count} order lama dibatalkan.`)
  }
  return NextResponse.json({ cleaned: cleaned.count })
}
