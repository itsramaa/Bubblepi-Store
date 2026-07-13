import { prisma, notify } from "./_common"

async function main() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const [revenueToday, ordersToday, totalPending, criticalStock, topProducts] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "FULFILLED", paidAt: { gte: yesterday, lt: today } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PENDING_STOCK"] } } }),
    prisma.variant.findMany({ include: { stock: { where: { status: "AVAILABLE" } } } })
      .then((v) => v.filter((x) => x.stock.length < 5)),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      where: { order: { status: "FULFILLED", paidAt: { gte: yesterday } } },
      _sum: { price: true },
      orderBy: { _sum: { price: "desc" } },
      take: 3,
    }),
  ])

  const variantIds = topProducts.map((p) => p.variantId)
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true } } },
  })
  const variantMap = Object.fromEntries(variants.map((v) => [v.id, v]))

  const topList = topProducts.map((p) => {
    const v = variantMap[p.variantId]
    return `• ${v?.product.name} (${v?.name}): Rp ${(p._sum.price ?? 0).toLocaleString("id-ID")}`
  }).join("\n")

  const critList = criticalStock.slice(0, 5).map((v) =>
    `• ${v.name}: ${v.stock.length} unit`
  ).join("\n")

  await notify(
    `📊 <b>Laporan Harian Bubblepi</b>\n` +
    `📅 ${yesterday.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
    `💰 Revenue: <b>Rp ${(revenueToday._sum.total ?? 0).toLocaleString("id-ID")}</b>\n` +
    `🛒 Pesanan: ${ordersToday}\n` +
    `⏳ Pending: ${totalPending}\n\n` +
    (topList ? `🏆 Top Produk:\n${topList}\n\n` : "") +
    (criticalStock.length > 0 ? `⚠️ Stok Kritis (${criticalStock.length} varian):\n${critList}` : `✅ Semua stok aman`)
  )

  console.log("Daily report sent")
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
