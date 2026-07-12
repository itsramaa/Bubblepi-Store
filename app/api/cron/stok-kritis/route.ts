import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET() {
  const variants = await db.variant.findMany({
    include: {
      product: { select: { name: true } },
      _count: { select: { stock: { where: { status: "AVAILABLE" } } } },
    },
  })

  const critical = variants.filter((v) => v._count.stock > 0 && v._count.stock <= 5)
  const empty = variants.filter((v) => v._count.stock === 0)

  if (critical.length > 0 || empty.length > 0) {
    const lines = ["⚠️ <b>Alert Stok</b>"]
    if (critical.length > 0) {
      lines.push("", "Kritis:")
      critical.forEach((v) => lines.push("* " + v.product.name + " " + v.name + ": " + v._count.stock + " sisa"))
    }
    if (empty.length > 0) {
      lines.push("", "Habis:")
      empty.forEach((v) => lines.push("* " + v.product.name + " " + v.name))
    }
    await sendTelegramNotification(lines.join("\n"))
  }

  return NextResponse.json({ critical: critical.length, empty: empty.length })
}
