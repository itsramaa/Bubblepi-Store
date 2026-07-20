/**
 * Supplier Factory & Registry
 * Manages all supplier adapters with fallback logic
 */

import { db } from "@/lib/db"
import { BaseSupplier, SupplierAdapter, OrderRequest, OrderResponse, SupplierProduct } from "./base"

// Lazy-loaded adapters
const adapters = new Map<string, SupplierAdapter>()

/** Get supplier adapter by ID */
export async function getSupplierAdapter(supplierId: string): Promise<SupplierAdapter | null> {
  // Check cache first
  if (adapters.has(supplierId)) {
    return adapters.get(supplierId)!
  }

  // Load from DB
  const supplier = await db.supplier.findUnique({
    where: { id: supplierId },
  })

  if (!supplier || !supplier.isActive) {
    return null
  }

  const adapter = createAdapter(supplier.type, supplier.config as Record<string, unknown>)
  if (adapter) {
    adapters.set(supplierId, adapter)
  }

  return adapter
}

/** Create adapter based on type */
function createAdapter(type: string, config: Record<string, unknown>): SupplierAdapter | null {
  switch (type) {
    case "TELEGRAM_BOT":
      return new TelegramBotSupplier(config)
    case "API_HTTP":
      return new ApiHttpSupplier(config)
    default:
      console.warn(`Unknown supplier type: ${type}`)
      return null
  }
}

/** Get all active suppliers */
export async function getActiveSuppliers() {
  return db.supplier.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
  })
}

/** Order with fallback - tries multiple suppliers */
export async function orderWithFallback(
  variantId: string,
  request: OrderRequest
): Promise<{ success: boolean; supplierId?: string; response?: OrderResponse; error?: string }> {
  // Get suppliers that have this variant
  const suppliers = await db.supplier.findMany({
    where: { 
      isActive: true,
      products: { some: { variantId } }
    },
    include: { products: true },
    orderBy: { priority: "asc" },
  })

  const errors: string[] = []

  for (const supplier of suppliers) {
    try {
      const adapter = await getSupplierAdapter(supplier.id)
      if (!adapter) continue

      const response = await adapter.order(request)
      
      if (response.success) {
        return { success: true, supplierId: supplier.id, response }
      }

      // If supplier returned retryAfter, wait and retry
      if (response.retryAfter) {
        await new Promise((resolve) => setTimeout(resolve, response.retryAfter! * 1000))
        const retryResponse = await adapter.order(request)
        if (retryResponse.success) {
          return { success: true, supplierId: supplier.id, response: retryResponse }
        }
        errors.push(`${supplier.name}: ${retryResponse.error}`)
      } else {
        errors.push(`${supplier.name}: ${response.error}`)
      }
    } catch (error) {
      errors.push(`${supplier.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return { 
    success: false, 
    error: `All suppliers failed: ${errors.join("; ")}` 
  }
}

/** Clear adapter cache (for testing) */
export function clearSupplierCache() {
  adapters.clear()
}

// ==================== Telegram Bot Supplier ====================

class TelegramBotSupplier extends BaseSupplier {
  readonly name = "Telegram Bot"
  readonly type = "telegram" as const

  private config: {
    botToken: string
    chatId: string
    sessionPath?: string
  }

  constructor(config: Record<string, unknown>) {
    super()
    this.config = config as { botToken: string; chatId: string; sessionPath?: string }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple connection test - send a test message or check bot info
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`)
      return response.ok
    } catch {
      return false
    }
  }

  async getProducts(): Promise<SupplierProduct[]> {
    // Telegram bot suppliers typically don't have a products API
    // Products are managed internally in BubblePI
    return []
  }

  async getProduct(productId: string): Promise<SupplierProduct | null> {
    return null
  }

  async order(request: OrderRequest): Promise<OrderResponse> {
    // This would send a message to the Telegram bot
    // Implementation depends on specific bot commands
    try {
      const message = `/order ${request.productId} ${request.quantity}${request.note ? ` ${request.note}` : ""}`
      
      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.config.chatId,
            text: message,
          }),
        }
      )

      if (!response.ok) {
        return { success: false, error: "Failed to send order to supplier bot" }
      }

      // Parse response - format depends on bot implementation
      const data = await response.json() as Record<string, unknown>
      
      // Assuming bot returns credentials in some format
      const credentials = data.credentials as string[] | undefined
      
      return {
        success: true,
        orderId: data.order_id as string | undefined,
        credentials,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async checkOrderStatus(orderId: string): Promise<OrderResponse> {
    // Would need bot to support status check
    return { success: false, error: "Status check not implemented for Telegram bot" }
  }

  async getBalance(): Promise<number> {
    // Would need bot to support balance check
    return 0
  }
}

// ==================== API HTTP Supplier ====================

class ApiHttpSupplier extends BaseSupplier {
  readonly name = "HTTP API"
  readonly type = "api" as const

  private config: {
    baseUrl: string
    apiKey?: string
    username?: string
    password?: string
  }

  constructor(config: Record<string, unknown>) {
    super()
    this.config = config as { baseUrl: string; apiKey?: string; username?: string; password?: string }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }
    return headers
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        headers: this.getHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getProducts(): Promise<SupplierProduct[]> {
    const response = await this.withRetry(async () => {
      const res = await fetch(`${this.config.baseUrl}/products`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })

    const products = (response as { data?: Array<{ variantId: string; price: number; stock: number }> }).data ?? []
    return products.map(p => ({ supplierProductId: p.variantId, name: "", price: p.price, stock: p.stock }))
  }

  async getProduct(productId: string): Promise<SupplierProduct | null> {
    const response = await this.withRetry(async () => {
      const res = await fetch(`${this.config.baseUrl}/products/${productId}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })

    const data = response as { data: { variantId: string; price: number; stock: number } }
    return data.data ? { supplierProductId: data.data.variantId, name: "", price: data.data.price, stock: data.data.stock } : null
  }

  async order(request: OrderRequest): Promise<OrderResponse> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.config.baseUrl}/orders`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })

      return {
        success: true,
        orderId: (response as { order_id: string }).order_id,
        credentials: (response as { credentials: string[] }).credentials,
      }
    } catch (error) {
      // Check if rate limited
      if (error instanceof Error && error.message.includes("429")) {
        return { success: false, error: "Rate limited", retryAfter: 60 }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async checkOrderStatus(orderId: string): Promise<OrderResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/orders/${orderId}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json() as { status: string; credentials?: string[] }
      
      return {
        success: data.status === "completed",
        credentials: data.credentials,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getBalance(): Promise<number> {
    try {
      const response = await fetch(`${this.config.baseUrl}/balance`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) return 0

      const data = await response.json() as { balance: number }
      return data.balance ?? 0
    } catch {
      return 0
    }
  }
}