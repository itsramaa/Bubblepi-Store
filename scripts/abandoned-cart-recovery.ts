import { prisma, notify, hoursAgo } from "./_common"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

async function main() {
  const carts = await prisma.abandonedCart.findMany({
    where: { recovered: false, createdAt: { lt: hoursAgo(1) } },
  })

  if (carts.length === 0) { console.log("No abandoned carts"); return }

  let sent = 0
  for (const cart of carts) {
    // Check if order already placed after cart save
    const recentOrder = await prisma.order.findFirst({
      where: { guestEmail: cart.email, createdAt: { gte: cart.createdAt } },
    })
    if (recentOrder) {
      await prisma.abandonedCart.update({ where: { id: cart.id }, data: { recovered: true } })
      continue
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: cart.email,
        subject: "Kamu ninggalin sesuatu di Bubblepi Store 👀",
        html: `
          <h2>Halo${cart.name ? ` ${cart.name}` : ""}!</h2>
          <p>Kamu hampir selesai belanja di Bubblepi Store, tapi sepertinya ada yang tertinggal di keranjang.</p>
          <p>Selesaikan pembelianmu sekarang sebelum stok habis!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/cart" style="background:#595B83;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">
            Kembali ke Keranjang →
          </a>
        `,
      })
      await prisma.abandonedCart.update({ where: { id: cart.id }, data: { recovered: true } })
      sent++
    } catch (e) {
      console.error(`Failed to send cart recovery to ${cart.email}:`, e)
    }
  }

  console.log(`Sent ${sent} cart recovery emails`)
  if (sent > 0) {
    await notify(`🛒 <b>Cart Recovery</b>\n${sent} email abandoned cart dikirim.`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
