/**
 * Auto-Order Orchestrator
 * Handles the flow: Payment Success → Lock Stock → Order Supplier → Delivery
 */

import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"
import { sendTelegramNotification } from "@/lib/telegram"
import { orderWithFallback } from "@/lib/suppliers"
import { encrypt } from "@/lib/crypto"

const MAX_RETRIES = 3
const RETRY_DELAYS = [5000, 15000, 30000] // 5s, 15s, 30s

export interface AutoOrderResult {
  success: boolean
  orderId: string
  credentials?: string[]
  error?: string
  supplierUsed?: string
}

/**
 * Main entry point: auto-fulfill an order after payment
 */
export async function autoFulfillOrder(orderId: string): Promise<AutoOrderResult> {
  console.log(`[AutoOrder] Starting fulfillment for order ${orderId}`)

  // 1. Get order with items
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: true,
        },
      },
    },
  })

  if (!order) {
    return { success: false, orderId, error: "Order not found" }
  }

  if (order.status !== "AWAITING_PAYMENT" && order.status !== "PROCESSING") {
    return { success: false, orderId, error: `Order status is ${order.status}, not ready for fulfillment` }
  }

  // 2. Lock stock (AVAILABLE → HOLD)
  const lockedItems = await lockStock(orderId, order.items)
  if (lockedItems.length === 0) {
    await sendTelegramNotification(`⚠️ <b>Stok Tidak Cukup!</b>\nOrder: <code>${order.orderNumber}</code>\nTidak ada stok tersedia untuk diverifikasi.`)
    return { success: false, orderId, error: "No stock available" }
  }

  // 3. Order from supplier(s) with fallback
  const allCredentials: string[] = []
  let lastError: string | undefined
  let supplierUsed: string | undefined

  for (const item of order.items) {
    const result = await orderWithRetry(item.variantId, {
      productId: item.variant.supplierVariantId || item.variantId,
      quantity: item.quantity,
    })

    if (!result.success) {
      lastError = result.error
      // Release held stock on failure
      await releaseStock(orderId)
      return { success: false, orderId, error: result.error }
    }

    if (result.response?.credentials) {
      allCredentials.push(...result.response.credentials)
    }
    supplierUsed = result.supplierId
  }

  // 4. If we got credentials, fulfill the order
  if (allCredentials.length > 0) {
    // Encrypt credentials before storage
    const encryptedCredentials = allCredentials.map((cred) => encrypt(cred))

    // Update stock to SOLD and deliver
    await db.accountStock.updateMany({
      where: { orderId, status: "HOLD" },
      data: { status: "SOLD", soldAt: new Date() },
    })

    // Update order status and trigger delivery email
    await fulfillOrder(orderId)

    // Store credentials in stock records (join with newline)
    await db.accountStock.updateMany({
      where: { orderId, status: "SOLD" },
      data: { credentials: encryptedCredentials.join("\n---\n") },
    })

    await sendTelegramNotification(
      `✅ <b>Auto-Order Sukses!</b>\n` +
      `Order: <code>${order.orderNumber}</code>\n` +
      `Supplier: ${supplierUsed}\n` +
      `Credentials: ${allCredentials.length} akun`
    )

    return {
      success: true,
      orderId,
      credentials: allCredentials,
      supplierUsed,
    }
  }

  // No credentials yet - might need to poll
  await sendTelegramNotification(
    `⏳ <b>Menunggu Credentials</b>\n` +
    `Order: <code>${order.orderNumber}</code>\n` +
    `Supplier: ${supplierUsed}\n` +
    `Memulai polling...`
  )

  return {
    success: true,
    orderId,
    supplierUsed,
    error: "Credentials pending - polling started",
  }
}

/**
 * Lock stock (AVAILABLE → HOLD) with retry
 */
async function lockStock(
  orderId: string,
  items: Array<{ variantId: string; quantity: number }>
): Promise<Array<{ variantId: string; stockId: string }>> {
  const locked: Array<{ variantId: string; stockId: string }> = []

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const stock = await db.accountStock.findFirst({
        where: { variantId: item.variantId, status: "AVAILABLE" },
        orderBy: { acquiredAt: "asc" },
      })

      if (!stock) continue

      await db.accountStock.update({
        where: { id: stock.id },
        data: { status: "HOLD", orderId },
      })

      locked.push({ variantId: item.variantId, stockId: stock.id })
    }
  }

  return locked
}

/**
 * Release held stock back to AVAILABLE
 */
async function releaseStock(orderId: string): Promise<void> {
  await db.accountStock.updateMany({
    where: { orderId, status: "HOLD" },
    data: { status: "AVAILABLE", orderId: null },
  })
}

/**
 * Order with retry logic
 */
async function orderWithRetry(
  variantId: string,
  request: { productId: string; quantity: number }
): Promise<{ success: boolean; response?: { credentials?: string[] }; error?: string; supplierId?: string }> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await orderWithFallback(variantId, request)

    if (result.success && result.response?.success) {
      return {
        success: true,
        response: { credentials: result.response.credentials },
        supplierId: result.supplierId,
      }
    }

    // If rate limited, wait and retry
    if (result.response?.retryAfter) {
      console.log(`[AutoOrder] Rate limited, waiting ${result.response.retryAfter}s`)
      await new Promise((resolve) => setTimeout(resolve, result.response!.retryAfter! * 1000))
      continue
    }

    // If failed but not rate limited, log and continue to next supplier attempt
    console.log(`[AutoOrder] Attempt ${attempt + 1} failed:`, result.error)
  }

  return { success: false, error: `All ${MAX_RETRIES} attempts failed` }
}

/**
 * Poll for credentials (called by cron job)
 */
export async function pollOrderCredentials(orderId: string): Promise<AutoOrderResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: true } } },
  })

  if (!order || order.status === "DELIVERED") {
    return { success: true, orderId } // Already fulfilled
  }

  // Check if we have credentials yet
  const stocks = await db.accountStock.findMany({
    where: { orderId, status: "HOLD" },
  })

  // If still HOLD after X minutes, notify admin
  const heldDuration = Date.now() - (order.paidAt?.getTime() || order.createdAt.getTime())
  if (heldDuration > 10 * 60 * 1000 && stocks.length > 0) {
    await sendTelegramNotification(
      `⚠️ <b>Order Terlama</b>\n` +
      `Order: <code>${order.orderNumber}</code>\n` +
      `Menunggu credentials selama ${Math.round(heldDuration / 60000)} menit`
    )
  }

  return { success: false, orderId, error: "Still waiting for credentials" }
}