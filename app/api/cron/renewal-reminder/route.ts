import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request); if (cronError) return cronError

  const resend = new Resend(process.env.RESEND_API_KEY)
  const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  // Check warranties expiring soon
  const warranties = await db.warranty.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: { lte: in3days, gte: new Date() },
    },
    include: {
      order: { select: { guestEmail: true, guestName: true, orderNumber: true } },
      variant: { include: { product: { select: { name: true, slug: true } } } },
    },
  })

  // Send renewal reminders
  const sent = new Set<string>()
  let count = 0
  for (const w of warranties) {
    if (!w.order || !w.order.guestEmail || sent.has(w.order.guestEmail)) continue
    sent.add(w.order.guestEmail)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@bubblepi.store",
      to: w.order.guestEmail,
      subject: `Akun ${w.variant.product.name} kamu akan expired!`,
      html: `
        <p>Halo ${w.order.guestName ?? "Customer"},</p>
        <p>Akun <strong>${w.variant.product.name} (${w.variant.name})</strong> kamu akan expired pada <strong>${w.expiryDate?.toLocaleDateString("id-ID")}</strong>.</p>
        <p>Perpanjang sekarang sebelum kehabisan stok!</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/products/${w.variant.product.slug}">Perpanjang Sekarang →</a></p>
      `,
    })
    count++
  }

  return NextResponse.json({ sent: count })
}