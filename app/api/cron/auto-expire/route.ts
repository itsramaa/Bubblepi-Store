import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError
  // Auto-expire only applies to warranty claims, not stock
  // Stock expires based on warranty duration
  const expired = { count: 0 }
  if (expired.count > 0) {
    await sendTelegramNotification(`⏰ <b>Auto-Expire Stok</b>
${expired.count} credentials di-expire otomatis.`)
  }
  return NextResponse.json({ expired: expired.count })
}
