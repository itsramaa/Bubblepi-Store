/**
 * Telegram Notification Bot
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

interface MessageOptions {
  parse_mode?: "HTML" | "Markdown"
  disable_notification?: boolean
}

/**
 * Send message to Telegram
 */
export async function sendTelegramNotification(
  message: string,
  options: MessageOptions = { parse_mode: "HTML" }
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[Telegram] Not configured, skipping:", message.slice(0, 50))
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: options.parse_mode,
        disable_notification: options.disable_notification,
      }),
    })

    if (!response.ok) {
      console.error("[Telegram] Failed:", await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error("[Telegram] Error:", error)
    return false
  }
}

/**
 * Send notification for new order
 */
export async function notifyNewOrder(orderNumber: string, total: number, customerName: string) {
  return sendTelegramNotification(
    `🛒 <b>New Order</b>\n` +
    `Order: ${orderNumber}\n` +
    `Customer: ${customerName}\n` +
    `Total: Rp ${total.toLocaleString("id-ID")}`
  )
}

/**
 * Send notification for payment received
 */
export async function notifyPaymentReceived(orderNumber: string, amount: number) {
  return sendTelegramNotification(
    `✅ <b>Payment Received</b>\n` +
    `Order: ${orderNumber}\n` +
    `Amount: Rp ${amount.toLocaleString("id-ID")}`
  )
}

/**
 * Send notification for warranty claim
 */
export async function notifyWarrantyClaim(orderNumber: string, reason: string) {
  return sendTelegramNotification(
    `🛡️ <b>Warranty Claim</b>\n` +
    `Order: ${orderNumber}\n` +
    `Reason: ${reason}`
  )
}