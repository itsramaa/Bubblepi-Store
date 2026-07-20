/**
 * Barbar Store Supplier Adapter
 * Uses HTTP API pattern
 */

import type { SupplierAdapter, SupplierProduct, OrderRequest, OrderResponse } from "./base"
import { BaseSupplier } from "./base"

export class BarbarStoreAdapter extends BaseSupplier {
  readonly name = "BarbarStore"
  readonly type = "api" as const

  private baseUrl = process.env.BARBAR_STORE_URL || "https://barbarstore.my.id/api"
  private apiKey = process.env.BARBAR_STORE_API_KEY || ""

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  }

  async testConnection(): Promise<boolean> {
    try { return (await this.request<{ status: string }>("/health")).status === "ok" }
    catch { return false }
  }

  async getProducts(): Promise<SupplierProduct[]> {
    const data = await this.request<{ products: any[] }>("/products")
    return data.products.map((p) => ({ supplierProductId: p.id, name: p.name, price: p.price, stock: p.stock }))
  }

  async getProduct(productId: string): Promise<SupplierProduct | null> {
    try {
      const p = await this.request<any>(`/products/${productId}`)
      return { supplierProductId: p.id, name: p.name, price: p.price, stock: p.stock }
    } catch { return null }
  }

  async order(request: OrderRequest): Promise<OrderResponse> {
    const data = await this.request<{ success: boolean; orderId: string; credentials?: string[] }>("/orders", {
      method: "POST",
      body: JSON.stringify(request),
    })
    return { success: data.success, orderId: data.orderId, credentials: data.credentials }
  }

  async checkOrderStatus(orderId: string): Promise<OrderResponse> {
    const data = await this.request<any>(`/orders/${orderId}`)
    return { success: true, orderId, credentials: data.credentials }
  }

  async getBalance(): Promise<number> {
    const data = await this.request<{ balance: number }>("/balance")
    return data.balance
  }
}