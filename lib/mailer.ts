import { Resend } from "resend"
import OrderConfirmationEmail from "@/emails/OrderConfirmation"
import AccountDeliveryEmail from "@/emails/AccountDelivery"
import PaymentReceivedEmail from "@/emails/PaymentReceived"
import OrderExpiredEmail from "@/emails/OrderExpired"
import WarrantyClaimReceivedEmail from "@/emails/WarrantyClaimReceived"
import LowStockAlertEmail from "@/emails/LowStockAlert"

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

export async function sendPaymentReceived(params: {
  to: string
  customerName: string
  orderNumber: string
  orderId: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Pembayaran Diterima ${params.orderNumber}`,
    react: PaymentReceivedEmail({
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    }),
  })
}

export async function sendOrderExpired(params: {
  to: string
  customerName: string
  orderNumber: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Pesanan Kedaluwarsa ${params.orderNumber}`,
    react: OrderExpiredEmail({
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      storeUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
  })
}

export async function sendWarrantyClaimReceived(params: {
  to: string
  customerName: string
  orderNumber: string
  claimDescription: string
  orderId: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Klaim Garansi Diterima ${params.orderNumber}`,
    react: WarrantyClaimReceivedEmail({
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      claimDescription: params.claimDescription,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    }),
  })
}

export async function sendLowStockAlert(params: {
  to: string
  variants: Array<{ name: string; productName: string; available: number }>
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: "⚠️ Alert Stok Kritis — Bubblepi Store",
    react: LowStockAlertEmail({
      variants: params.variants,
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/stock`,
    }),
  })
}
