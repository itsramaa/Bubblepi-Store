/**
 * Telegram Bot Supplier Adapter
 */

import type { SupplierAdapter, SupplierProduct, OrderRequest, OrderResponse } from "./base"
import { BaseSupplier } from "./base"

interface TelegramConfig {
  botToken: string
  chatId: string
}

export class TelegramBotAdapter extends BaseSupplier {
  readonly name = "Telegram Bot"
  readonly type = "telegram" as const
  private config: TelegramConfig

  constructor(config: TelegramConfig) {
    super()
    this.config = config
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/getMe`
      const res = await fetch(url)
      return res.ok
    } catch {
      return false
    }
  }

  async getProducts(): Promise<SupplierProduct[]> {
    // Query supplier via Telegram for available products
    return []
  }

  async getProduct(productId: string): Promise<SupplierProduct | null> {
    return null
  }

  async order(request: OrderRequest): Promise<OrderResponse> {
    const message = `🛒 Order Request\nProduct: ${request.productId}\nQty: ${request.quantity}\nNote: ${request.note || "-"}`
    await this.sendMessage(message)
    
    // Return pending - actual credentials come via callback
    return { success: true, orderId: `tg-${Date.now()}`, credentials: [] }
  }

  async checkOrderStatus(orderId: string): Promise<OrderResponse> {
    return { success: true, orderId, credentials: [] }
  }

  async getBalance(): Promise<number> {
    return 0
  }

  private async sendMessage(text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: this.config.chatId, text }),
    })
  }
}