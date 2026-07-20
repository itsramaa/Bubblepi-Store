/**
 * Delivery System
 * Handles email delivery of credentials after order fulfillment
 */

import { Resend } from "resend"
import { db } from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { DeliveryEmail } from "@/emails/delivery-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendDeliveryEmailParams {
  orderId: string
}

/**
 * Send delivery email with credentials
 */
export async function sendDeliveryEmail(orderId: string): Promise<boolean> {
  // Get order with items
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
      warranty: true,
    },
  })

  if (!order) {
    console.error(`[Delivery] Order ${orderId} not found`)
    return false
  }

  // Get stock credentials
  const stocks = await db.accountStock.findMany({
    where: { orderId, status: "SOLD" },
    orderBy: { acquiredAt: "asc" },
  })

  if (stocks.length === 0) {
    console.error(`[Delivery] No stock credentials found for order ${orderId}`)
    return false
  }

  // Decrypt credentials
  const credentials = stocks
    .map((stock) => {
      try {
        return decrypt(stock.credentials)
      } catch {
        return stock.credentials // already decrypted or plain
      }
    })
    .join("\n\n---\n\n")

  // Calculate warranty expiry
  let warrantyExpiry: string | undefined
  if (order.warranty?.expiryDate) {
    const expiryDate = new Date(order.warranty.expiryDate)
    warrantyExpiry = expiryDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Get customer info from order
  const customerName = order.guestName ?? "Customer"
  const customerEmail = order.guestEmail

  if (!customerEmail) {
    console.error(`[Delivery] No email address for order ${orderId}`)
    return false
  }

  // Build product description
  const productNames = order.items
    .map((item) => `${item.variant.product.name} - ${item.variant.name}`)
    .join(", ")

  try {
    await resend.emails.send({
      from: "BubblePI Store <noreply@bubblepi.store>",
      to: customerEmail,
      subject: `🎉 Pesanan ${order.orderNumber} Siap! - Credentials Included`,
      react: DeliveryEmail({
        customerName,
        orderNumber: order.orderNumber,
        productName: productNames,
        variantName: order.items[0]?.variant.name || "",
        credentials,
        warrantyExpiry,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
      }),
    })

    console.log(`[Delivery] Email sent for order ${order.orderNumber}`)
    return true
  } catch (error) {
    console.error(`[Delivery] Failed to send email:`, error)
    return false
  }
}

/**
 * Send delivery for multiple orders (batch)
 */
export async function sendDeliveryEmailsForPending(): Promise<number> {
  // Find orders that are DELIVERED but no email sent
  // This is a safety check - normally email is sent immediately
  const orders = await db.order.findMany({
    where: {
      status: "DELIVERED",
      // Could add a flag to track if email was sent
    },
    take: 10,
    orderBy: { updatedAt: "asc" },
  })

  let sent = 0
  for (const order of orders) {
    const success = await sendDeliveryEmail(order.id)
    if (success) sent++
  }

  return sent
}