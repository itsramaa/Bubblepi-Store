import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export const dynamic = "force-dynamic"

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [orders, topProducts] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: since } }, select: { status: true, total: true, customerEmail: true } }),
    db.orderItem.groupBy({
      by: ["variantId"],
      where: { order: { status: "FULFILLED", paidAt: { gte: since } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ])

  const fulfilled = orders.filter((o) => o.status === "FULFILLED")
  const revenue = fulfilled.reduce((a, o) => a + o.total, 0)
  const uniqueBuyers = new Set(fulfilled.map((o) => o.customerEmail)).size
  const fulfillRate = orders.length > 0 ? Math.round((fulfilled.length / orders.length) * 100) : 0

  const topVariants = await db.variant.findMany({
    where: { id: { in: topProducts.map((t) => t.variantId) } },
    include: { product: { select: { name: true } } },
  })

  const topLines = topProducts.map((t) => {
    const v = topVariants.find((v) => v.id === t.variantId)
    return "* " + (v?.product.name ?? "") + " " + (v?.name ?? "") + ": " + (t._sum.quantity ?? 0) + "x"
  })

  const lines = [
    "📅 <b>Weekly Summary</b>",
    "",
    "💰 Revenue 7 hari: <b>Rp " + revenue.toLocaleString("id-ID") + "</b>",
    "📦 Total order: <b>" + orders.length + "</b>",
    "✅ Fulfilled: <b>" + fulfilled.length + "</b> (" + fulfillRate + "%)",
    "👥 Unique buyer: <b>" + uniqueBuyers + "</b>",
    "",
    "🏆 Top 5 Produk:",
    ...(topLines.length > 0 ? topLines : ["—"]),
  ]

  await sendTelegramNotification(lines.join("\n"))
  return NextResponse.json({ ok: true })
}
