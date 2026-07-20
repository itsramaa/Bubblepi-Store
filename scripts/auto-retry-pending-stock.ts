import { prisma, notify } from "./_common"
import { fulfillOrder } from "../lib/order"

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: "PROCESSING" },
    select: { id: true, orderNumber: true },
  })
  if (orders.length === 0) { console.log("No PROCESSING orders"); return }

  let succeeded = 0, failed = 0
  for (const order of orders) {
    try {
      await fulfillOrder(order.id)
      succeeded++
    } catch {
      failed++
    }
  }

  console.log(`Retry PROCESSING: ${succeeded} ok, ${failed} failed`)
  if (succeeded > 0) {
    await notify(`✅ <b>Retry PROCESSING</b>\n${succeeded} order berhasil di-fulfill, ${failed} gagal.`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
