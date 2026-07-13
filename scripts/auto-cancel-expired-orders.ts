import { prisma, notify, hoursAgo } from "./_common"

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: "AWAITING_PAYMENT", createdAt: { lt: hoursAgo(25) } },
    data: { status: "FAILED", cancelReason: "Invoice kedaluwarsa (>25 jam)" },
  })
  if (result.count === 0) { console.log("No expired orders"); return }
  console.log(`Cancelled ${result.count} expired orders`)
  await notify(`🗑️ <b>Auto-Cancel</b>\n${result.count} order AWAITING_PAYMENT >25 jam otomatis dibatalkan.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
