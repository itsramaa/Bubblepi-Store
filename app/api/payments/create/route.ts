import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createInvoice } from "@/lib/xendit"
import { sendOrderConfirmation } from "@/lib/mailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentMethod, bankCode } = body

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
      customerName: order.customerName,
      customerEmail: order.customerEmail,
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
      to: order.customerEmail,
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
