import { prisma, notify } from "./_common"
import { fulfillOrder } from "../lib/order"

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING_STOCK" },
    select: { id: true, orderNumber: true },
  })
  if (orders.length === 0) { console.log("No PENDING_STOCK orders"); return }

  let succeeded = 0, failed = 0
  for (const order of orders) {
    try {
      await fulfillOrder(order.id)
      succeeded++
    } catch {
      failed++
    }
  }

  console.log(`Retry PENDING_STOCK: ${succeeded} ok, ${failed} failed`)
  if (succeeded > 0) {
    await notify(`✅ <b>Retry PENDING_STOCK</b>\n${succeeded} order berhasil di-fulfill, ${failed} gagal.`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
