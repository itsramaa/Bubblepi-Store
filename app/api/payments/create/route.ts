import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createInvoice } from "@/lib/xendit"
import { sendOrderConfirmation } from "@/lib/mailer"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = checkRateLimit(`payment-create:${ip}`, 10, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const body = await request.json()
    const { orderId, paymentMethod, bankCode } = body

    // Validation
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId required" }, { status: 400 })
    }
    if (!paymentMethod || !["BCA", "MANDIRI", "BNI", "BRI", "QRIS", "DANA", "OVO", "LINKAJA"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { variant: { include: { product: true } } } } },
    })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order sudah diproses" }, { status: 400 })
    }

    const invoice = await createInvoice({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod,
      bankCode,
      customerName: order.guestName ?? "Customer",
      customerEmail: order.guestEmail ?? "unknown@email.com",
    })

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "AWAITING_PAYMENT",
        paymentMethod,
        xenditInvoiceId: invoice.id,
        xenditPaymentUrl: invoice.invoiceUrl,
      },
    })

    await sendOrderConfirmation({
      to: order.guestEmail ?? "unknown@email.com",
      orderNumber: order.orderNumber,
      items: order.items.map((i: { variant: { name: string }; quantity: number; price: number }) => ({
        name: `${i.variant.name}`,
        quantity: i.quantity,
        price: i.price,
      })),
      total: order.total,
      paymentUrl: invoice.invoiceUrl ?? "",
      orderId: order.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: invoice.invoiceUrl,
        invoiceId: invoice.id,
      },
    })
  } catch (error) {
    console.error("Payment create error:", error)
    return NextResponse.json({ error: "Gagal membuat pembayaran" }, { status: 500 })
  }
}
