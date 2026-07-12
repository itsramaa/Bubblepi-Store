import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { generateOrderId } from "@/lib/utils"
import { sendTelegramNotification } from "@/lib/telegram"

const TAX_RATE = 0.11 // 11% PPN Indonesia

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, items } = body

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

    const tax = Math.round(subtotal * TAX_RATE)
    const total = subtotal + tax

    const orderNumber = generateOrderId()
  
  // UTM tracking
  let utmSource: string | null = null
  let utmMedium: string | null = null
  let utmCampaign: string | null = null
  try {
    const cookieStore = await cookies()
    const utmRaw = cookieStore.get("utm_data")?.value
    if (utmRaw) {
      const utm = JSON.parse(utmRaw)
      utmSource = utm.utmSource || null
      utmMedium = utm.utmMedium || null
      utmCampaign = utm.utmCampaign || null
    }
  } catch {}

  const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        subtotal,
        tax,
        total,
        status: "PENDING",
        items: { create: orderItems },
      },
      include: { items: true },
    })

    // fire-and-forget — don't await
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
