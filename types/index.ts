import type { Prisma } from "@prisma/client"

// Cart
export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantName: string
  price: number
  quantity: number
  duration: string
}

// Product with variants (for display)
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true }
}>

// Order with items (for detail page)
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: { include: { variant: true } }
    stocks: true
  }
}>

// Variant with stock counts
export type VariantWithStock = Prisma.VariantGetPayload<{
  include: {
    product: { select: { name: true; slug: true; image: true } }
    stock: true
  }
}>

// Admin stats
export interface AdminStats {
  revenueToday: number
  totalOrders: number
  pendingOrders: number
  criticalStock: number // variants with < 5 available stock
}

// Checkout form data
export interface CheckoutFormData {
  customerName: string
  customerEmail: string
  paymentMethod: "QRIS" | "VA"
  bankCode?: string // for VA: BCA, BRI, BNI, PERMATA
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
