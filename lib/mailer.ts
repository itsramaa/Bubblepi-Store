import { Resend } from "resend"
import OrderConfirmationEmail from "@/emails/OrderConfirmation"
import AccountDeliveryEmail from "@/emails/AccountDelivery"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendOrderConfirmation(params: {
  to: string
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentUrl: string
  orderId: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Konfirmasi Pesanan ${params.orderNumber}`,
    react: OrderConfirmationEmail({
      orderNumber: params.orderNumber,
      items: params.items,
      total: params.total,
      paymentUrl: params.paymentUrl,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    }),
  })
}

export async function sendAccountDelivery(params: {
  to: string
  orderNumber: string
  items: Array<{ name: string; credentials: string[] }>
  orderId: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Akun Anda Sudah Siap! ${params.orderNumber}`,
    react: AccountDeliveryEmail({
      orderNumber: params.orderNumber,
      items: params.items,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    }),
  })
}
