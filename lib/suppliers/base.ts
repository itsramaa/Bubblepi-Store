/**
 * Base Supplier Interface
 * Adapter pattern for multi-supplier integration
 */

export interface SupplierCredential {
  username: string
  password: string
  apiKey?: string
  sessionPath?: string
}

export interface SupplierProduct {
  supplierProductId: string
  name: string
  price: number // in IDR
  stock: number
  category?: string
}

export interface OrderRequest {
  productId: string
  quantity: number
  note?: string
}

export interface OrderResponse {
  success: boolean
  orderId?: string
  credentials?: string[]
  error?: string
  retryAfter?: number // seconds
}

export interface SupplierAdapter {
  readonly name: string
  readonly type: "telegram" | "api"

  /** Test connection to supplier */
  testConnection(): Promise<boolean>

  /** Get available products */
  getProducts(): Promise<SupplierProduct[]>

  /** Get specific product by ID */
  getProduct(productId: string): Promise<SupplierProduct | null>

  /** Order product(s) from supplier */
  order(request: OrderRequest): Promise<OrderResponse>

  /** Check order status */
  checkOrderStatus(orderId: string): Promise<OrderResponse>

  /** Get current balance/credits */
  getBalance(): Promise<number>
}

export abstract class BaseSupplier implements SupplierAdapter {
  abstract readonly name: string
  abstract readonly type: "telegram" | "api"

  abstract testConnection(): Promise<boolean>
  abstract getProducts(): Promise<SupplierProduct[]>
  abstract getProduct(productId: string): Promise<SupplierProduct | null>
  abstract order(request: OrderRequest): Promise<OrderResponse>
  abstract checkOrderStatus(orderId: string): Promise<OrderResponse>
  abstract getBalance(): Promise<number>

  /** Utility: retry with exponential backoff */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }
}