import { prisma, notify } from "./_common"

async function main() {
  const expired = await prisma.accountStock.updateMany({
    where: { status: "AVAILABLE", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  })
  if (expired.count === 0) { console.log("No stock to expire"); return }
  console.log(`Expired ${expired.count} stock entries`)
  await notify(`⏰ <b>Auto-Expire Stok</b>\n${expired.count} credentials di-expire karena sudah melewati tanggal expired.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
