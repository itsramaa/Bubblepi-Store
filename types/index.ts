import type { Prisma } from "@prisma/client"

// ==================== CART ====================

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantName: string
  price: number
  quantity: number
  warrantyOptionId?: string
  warrantyPrice?: number
}

// ==================== PRODUCT ====================
// Product with variants (for display)
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { 
    variants: { 
      include: { 
        warrantyOptions: true 
        stocks: true
      } 
    } 
  }
}>

export type VariantWithStock = Prisma.VariantGetPayload<{
  include: {
    product: { select: { name: true; slug: true; image: true } }
    stocks: { where: { status: "AVAILABLE" } }
    warrantyOptions: true
  }
}>

// ==================== ORDER ====================

// Extended order type with computed fields for frontend
export interface OrderDisplay extends Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } }
    items: { include: { variant: { include: { product: true } } } }
    stocks: true
  }
}> {}

export type OrderWithItems = OrderDisplay

// ==================== CHECKOUT ====================

export interface CheckoutFormData {
  // Guest checkout
  guestName?: string
  guestEmail?: string
  // Legacy aliases (for UI components)
  customerName?: string
  customerEmail?: string
  // Logged in user
  userId?: string
  // Payment
  paymentMethod: "QRIS" | "VA" | "VIRTUAL_ACCOUNT"
  bankCode?: string // for VA: BCA, BRI, BNI, PERMATA
  // Cart
  items?: CartItem[]
  voucherCode?: string
}

// ==================== ADMIN ====================

export interface AdminStats {
  revenueToday: number
  totalOrders: number
  pendingOrders: number
  criticalStock: number
}

// ==================== WARRANTY ====================

export interface WarrantyClaimForm {
  orderId: string
  orderItemId: string
  description: string
  proofImage?: string // base64 or URL
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
