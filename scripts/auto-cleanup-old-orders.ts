import { prisma, notify, daysAgo } from "./_common"

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: "PENDING", createdAt: { lt: daysAgo(7) } },
    data: { status: "FAILED", cancelReason: "Auto-cleanup: order PENDING >7 hari" },
  })
  if (result.count === 0) { console.log("Nothing to cleanup"); return }
  console.log(`Cleaned up ${result.count} stale orders`)
  await notify(`🧹 <b>Cleanup Order</b>\n${result.count} order PENDING >7 hari dihapus.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
