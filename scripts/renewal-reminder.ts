import { prisma, notify } from "./_common"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

async function main() {
  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 86400000)
  const oneDayAgo = new Date(now.getTime() - 86400000)

  // Find stocks expiring in 3 days, not yet reminded
  const expiringStocks = await prisma.accountStock.findMany({
    where: {
      status: "DELIVERED",
      expiresAt: { gte: now, lte: threeDaysLater },
    },
    include: {
      order: { select: { customerEmail: true, customerName: true, orderNumber: true, id: true } },
      variant: { include: { product: { select: { name: true } } } },
    },
  })

  if (expiringStocks.length === 0) { console.log("No renewals due"); return }

  // Group by email, max 1 email per customer per day
  const emailsSent = new Set<string>()
  let sent = 0

  for (const stock of expiringStocks) {
    if (!stock.order) continue
    const email = stock.order.customerEmail
    if (emailsSent.has(email)) continue

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `Akun ${stock.variant.product.name} kamu hampir expired!`,
        html: `
          <h2>Halo ${stock.order.customerName}!</h2>
          <p>Akun <strong>${stock.variant.product.name} (${stock.variant.name})</strong> kamu akan expired pada 
          <strong>${new Date(stock.expiresAt!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
          <p>Perpanjang sekarang di <a href="${process.env.NEXT_PUBLIC_APP_URL}/products">Bubblepi Store</a> sebelum akses berakhir.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${stock.order.id}">Lihat detail pesanan →</a></p>
        `,
      })
      emailsSent.add(email)
      sent++
    } catch (e) {
      console.error(`Failed to send renewal reminder to ${email}:`, e)
    }
  }

  console.log(`Sent ${sent} renewal reminder emails`)
  if (sent > 0) {
    await notify(`🔔 <b>Renewal Reminder</b>\n${sent} email pengingat perpanjangan dikirim.`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
