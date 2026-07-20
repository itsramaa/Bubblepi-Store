/**
 * Sekolokopoii Supplier Adapter
 */

import type { SupplierAdapter, SupplierProduct, OrderRequest, OrderResponse } from "./base"
import { BaseSupplier } from "./base"

export class SekolokopoiiAdapter extends BaseSupplier {
  readonly name = "Sekolokopoii"
  readonly type = "telegram" as const

  private botToken = process.env.SEKOLOKOPOII_TOKEN || ""
  private chatId = process.env.SEKOLOKOPOII_CHAT_ID || ""

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}${endpoint}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    })
    if (!res.ok) throw new Error(`Telegram API error: ${res.status}`)
    return res.json()
  }

  async testConnection(): Promise<boolean> {
    try { return (await this.request<{ ok: boolean }>("/getMe")).ok }
    catch { return false }
  }

  async getProducts(): Promise<SupplierProduct[]> {
    // Query via bot command
    return []
  }

  async getProduct(productId: string): Promise<SupplierProduct | null> {
    return null
  }

  async order(request: OrderRequest): Promise<OrderResponse> {
    const msg = `🛒 Order\nProduct: ${request.productId}\nQty: ${request.quantity}`
    await this.request("/sendMessage", {
      method: "POST",
      body: JSON.stringify({ chat_id: this.chatId, text: msg }),
    })
    return { success: true, orderId: `sk-${Date.now()}`, credentials: [] }
  }

  async checkOrderStatus(orderId: string): Promise<OrderResponse> {
    return { success: true, orderId, credentials: [] }
  }

  async getBalance(): Promise<number> { return 0 }
}