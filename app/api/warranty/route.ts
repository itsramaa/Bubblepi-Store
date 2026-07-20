import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"
import { sendWarrantyClaimReceived } from "@/lib/mailer"
import { z } from "zod"

const schema = z.object({
  orderId: z.string().cuid(),
  orderItemId: z.string().cuid(),
  claimReason: z.string().min(10).max(1000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderItemId, claimReason } = schema.parse(body)

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        guestEmail: true,
        guestName: true,
        status: true,
        paidAt: true,
        items: {
          include: {
            variant: {
              include: {
                warrantyOptions: true,
              },
            },
          },
        },
      },
    })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    if (order.status !== "DELIVERED") {
      return NextResponse.json({ error: "Order belum selesai" }, { status: 400 })
    }

    const orderItem = order.items.find((i) => i.id === orderItemId)
    if (!orderItem) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 })
    }

    // Cek variant punya garansi
    const hasWarranty = orderItem.variant.warrantyOptions && orderItem.variant.warrantyOptions.length > 0
    if (!hasWarranty) {
      return NextResponse.json({ error: "Varian ini tidak memiliki garansi" }, { status: 400 })
    }

    const existing = await db.warrantyClaim.findFirst({ where: { orderId, orderItemId } })
    if (existing) return NextResponse.json({ error: "Klaim sudah pernah diajukan untuk item ini" }, { status: 409 })

    // Find warranty for this order item
    const warranty = await db.warranty.findFirst({
      where: { orderId, order: { items: { some: { id: orderItemId } } } },
    })

    if (!warranty) {
      return NextResponse.json({ error: "Warranty tidak ditemukan untuk item ini" }, { status: 404 })
    }

    const claim = await db.warrantyClaim.create({ 
      data: { 
        warrantyId: warranty.id,
        orderItemId, 
        claimReason,
      } 
    })

    await sendTelegramNotification(
      `🛡️ <b>Klaim Garansi Baru</b>\nOrder: #${order.orderNumber}\nEmail: ${order.guestEmail ?? "unknown"}\nDeskripsi: ${claimReason.slice(0, 100)}`
    )

    sendWarrantyClaimReceived({
      to: order.guestEmail ?? "unknown@email.com",
      customerName: order.guestName ?? "Customer",
      orderNumber: order.orderNumber,
      claimDescription: claimReason,
      orderId: order.id,
    }).catch((err) => {
      console.error("sendWarrantyClaimReceived failed:", err)
    })

    return NextResponse.json({ success: true, claim }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })
  const claims = await db.warrantyClaim.findMany({ where: { orderId }, orderBy: { submittedAt: "desc" } })
  return NextResponse.json({ claims })
}