import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { generateOrderId } from "@/lib/utils"
import { sendTelegramNotification } from "@/lib/telegram"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// No PPN/tax — Xendit fee (QRIS 0.7%, VA Rp 4.000) ditanggung Xendit, tidak ditambahkan ke total

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = checkRateLimit(`create-order:${ip}`, 10, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const body = await request.json()
    const { customerName, customerEmail, items, voucherId, discountAmount } = body

    if (!customerName || !customerEmail || !items?.length) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const variantIds = items.map((i: { variantId: string }) => i.variantId)
    const variants = await db.variant.findMany({
      where: { id: { in: variantIds } },
    })

    let subtotal = 0
    const orderItems = items.map((item: { variantId: string; quantity: number }) => {
      const variant = variants.find((v: { id: string }) => v.id === item.variantId)
      if (!variant) throw new Error(`Variant ${item.variantId} not found`)
      subtotal += variant.price * item.quantity
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.price,
      }
    })

    const discount = discountAmount ?? 0
    const total = Math.max(subtotal - discount, 0)
    const orderNumber = generateOrderId()

    // UTM tracking + referral code
    let utmSource: string | null = null
    let utmMedium: string | null = null
    let utmCampaign: string | null = null
    let refCode: string | null = null
    try {
      const cookieStore = await cookies()
      const utmRaw = cookieStore.get("utm_data")?.value
      if (utmRaw) {
        const utm = JSON.parse(utmRaw)
        utmSource = utm.utmSource || null
        utmMedium = utm.utmMedium || null
        utmCampaign = utm.utmCampaign || null
      }
      refCode = cookieStore.get("ref_code")?.value ?? null
    } catch {}

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        subtotal,
        tax: 0,
        total,
        discountAmount: discount,
        refCode,
        ...(voucherId ? { voucherId } : {}),
        status: "PENDING",
        items: { create: orderItems },
      },
      include: { items: true },
    })

    if (voucherId) {
      await db.voucher.update({
        where: { id: voucherId },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {})
    }

    sendTelegramNotification(
      `🛒 <b>Pesanan Baru!</b>\n` +
      `Order: <code>${orderNumber}</code>\n` +
      `Pembeli: ${customerName} (${customerEmail})\n` +
      `Total: Rp ${total.toLocaleString("id-ID")}`
    )

    return NextResponse.json({
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 })
  }
}
