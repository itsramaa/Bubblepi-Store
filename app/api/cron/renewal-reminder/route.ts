import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError

  const resend = new Resend(process.env.RESEND_API_KEY)
  const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  const stocks = await db.accountStock.findMany({
    where: {
      status: "DELIVERED",
      expiresAt: { lte: in3days, gte: new Date() },
    },
    include: {
      order: { select: { customerEmail: true, customerName: true } },
      variant: { include: { product: { select: { name: true, slug: true } } } },
    },
  })

  // Deduplicate by email
  const sent = new Set<string>()
  let count = 0
  for (const stock of stocks) {
    if (!stock.order || sent.has(stock.order.customerEmail)) continue
    sent.add(stock.order.customerEmail)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@bubblepi.store",
      to: stock.order.customerEmail,
      subject: `Akun ${stock.variant.product.name} kamu akan expired!`,
      html: `
        <p>Halo ${stock.order.customerName},</p>
        <p>Akun <strong>${stock.variant.product.name} (${stock.variant.name})</strong> kamu akan expired pada <strong>${stock.expiresAt?.toLocaleDateString("id-ID")}</strong>.</p>
        <p>Perpanjang sekarang sebelum kehabisan stok!</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/products/${stock.variant.product.slug}">Perpanjang Sekarang →</a></p>
      `,
    })
    count++
  }

  return NextResponse.json({ sent: count })
}
