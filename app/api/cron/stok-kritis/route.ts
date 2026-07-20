import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError
  const variants = await db.variant.findMany({
    include: {
      product: { select: { name: true } },
      _count: { select: { stocks: { where: { status: "AVAILABLE" } } } },
    },
  })

  const critical = variants.filter((v) => v._count.stocks > 0 && v._count.stocks <= 5)
  const empty = variants.filter((v) => v._count.stocks === 0)

  if (critical.length > 0 || empty.length > 0) {
    const lines = ["⚠️ <b>Alert Stok</b>"]
    if (critical.length > 0) {
      lines.push("", "Kritis:")
      critical.forEach((v) => lines.push("* " + v.product.name + " " + v.name + ": " + v._count.stocks + " sisa"))
    }
    if (empty.length > 0) {
      lines.push("", "Habis:")
      empty.forEach((v) => lines.push("* " + v.product.name + " " + v.name))
    }
    await sendTelegramNotification(lines.join("\n"))
  }

  return NextResponse.json({ critical: critical.length, empty: empty.length })
}
