import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET() {
  const expired = await db.accountStock.updateMany({
    where: { status: "AVAILABLE", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  })
  if (expired.count > 0) {
    await sendTelegramNotification(`⏰ <b>Auto-Expire Stok</b>
${expired.count} credentials di-expire otomatis.`)
  }
  return NextResponse.json({ expired: expired.count })
}
