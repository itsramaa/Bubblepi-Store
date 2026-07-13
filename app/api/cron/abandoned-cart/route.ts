import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError
  const cutoff = new Date(Date.now() - 60 * 60 * 1000) // 1h ago
  const carts = await db.abandonedCart.findMany({
    where: { recovered: false, createdAt: { lt: cutoff } },
  })

  let recovered = 0
  for (const cart of carts) {
    // Check if they placed an order in last 2h
    const order = await db.order.findFirst({
      where: { customerEmail: cart.email, createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
    })
    if (order) {
      await db.abandonedCart.update({ where: { id: cart.id }, data: { recovered: true } })
      continue
    }
    // Send reminder
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@bubblepi.store",
      to: cart.email,
      subject: "Kamu lupa sesuatu di Bubblepi Store!",
      html: `
        <p>Halo ${cart.name},</p>
        <p>Kamu meninggalkan item di keranjangmu. Selesaikan pesananmu sebelum stok habis!</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/cart">Kembali ke Keranjang →</a></p>
      `,
    })
    await db.abandonedCart.update({ where: { id: cart.id }, data: { recovered: true } })
    recovered++
  }

  return NextResponse.json({ recovered })
}
