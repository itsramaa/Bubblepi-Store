import { prisma, notify, daysAgo } from "./_common"

async function main() {
  const weekStart = daysAgo(7)

  const [revenue, totalOrders, fulfilledOrders, topProducts, newBuyers] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "DELIVERED", paidAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { status: "DELIVERED", paidAt: { gte: weekStart } } }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      where: { order: { status: "DELIVERED", paidAt: { gte: weekStart } } },
      _sum: { price: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["guestEmail"],
      where: { createdAt: { gte: weekStart } },
      _count: { id: true },
    }).then((r) => r.filter((x) => x._count.id === 1).length),
  ])

  const variantIds = topProducts.map((p) => p.variantId)
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true } } },
  })
  const variantMap = Object.fromEntries(variants.map((v) => [v.id, v]))

  const topList = topProducts.map((p, i) => {
    const v = variantMap[p.variantId]
    return `${i + 1}. ${v?.product.name} (${v?.name}): Rp ${(p._sum.price ?? 0).toLocaleString("id-ID")}`
  }).join("\n")

  const rate = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0

  await notify(
    `📈 <b>Weekly Summary Bubblepi</b>\n` +
    `7 hari terakhir\n\n` +
    `💰 Revenue: <b>Rp ${(revenue._sum.total ?? 0).toLocaleString("id-ID")}</b>\n` +
    `🛒 Total Pesanan: ${totalOrders}\n` +
    `✅ Fulfillment Rate: ${rate}%\n` +
    `👤 Pembeli Baru: ${newBuyers}\n\n` +
    (topList ? `🏆 Top 5 Produk:\n${topList}` : "")
  )

  console.log("Weekly summary sent")
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
