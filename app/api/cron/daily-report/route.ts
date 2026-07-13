import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayOrders, pendingStock, criticalStock, topProducts] = await Promise.all([
    db.order.findMany({ where: { status: "FULFILLED", paidAt: { gte: today } }, select: { total: true } }),
    db.order.count({ where: { status: "PENDING_STOCK" } }),
    db.variant.findMany({
      include: {
        product: { select: { name: true } },
        _count: { select: { stock: { where: { status: "AVAILABLE" } } } },
      },
    }),
    db.orderItem.groupBy({
      by: ["variantId"],
      where: { order: { status: "FULFILLED", paidAt: { gte: today } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 3,
    }),
  ])

  const revenue = todayOrders.reduce((a, o) => a + o.total, 0)
  const critical = criticalStock.filter((v) => v._count.stock <= 5)

  const topVariantIds = topProducts.map((t) => t.variantId)
  const topVariants = await db.variant.findMany({
    where: { id: { in: topVariantIds } },
    include: { product: { select: { name: true } } },
  })

  const topLines = topProducts.map((t) => {
    const v = topVariants.find((v) => v.id === t.variantId)
    return "* " + (v?.product.name ?? "") + " " + (v?.name ?? "") + ": " + (t._sum.quantity ?? 0) + "x"
  })

  const critLines = critical.slice(0, 5).map((v) => "* " + v.product.name + " " + v.name + ": " + v._count.stock + " sisa")

  const lines = [
    "📊 <b>Daily Report</b> — " + today.toLocaleDateString("id-ID"),
    "",
    "💰 Revenue hari ini: <b>Rp " + revenue.toLocaleString("id-ID") + "</b>",
    "📦 Order selesai: <b>" + todayOrders.length + "</b>",
    "⏳ Pending stok: <b>" + pendingStock + "</b>",
    "",
    "🏆 Top Produk:",
    ...(topLines.length > 0 ? topLines : ["—"]),
    "",
    "⚠️ Stok Kritis:",
    ...(critLines.length > 0 ? critLines : ["Semua aman ✅"]),
  ]

  await sendTelegramNotification(lines.join("\n"))
  return NextResponse.json({ ok: true })
}
