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

export type OrderStatus = "PENDING" | "AWAITING_PAYMENT" | "PAID" | "PROCESSING" | "DELIVERED" | "FAILED" | "EXPIRED"
export type StockStatus = "AVAILABLE" | "HOLD" | "SOLD"
export type WarrantyStatus = "ACTIVE" | "CLAIMED" | "EXPIRED"
export type ClaimStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED"
export type SupplierType = "TELEGRAM_BOT" | "API"
export type PaymentMethod = "QRIS" | "VIRTUAL_ACCOUNT"
export type VoucherType = "PERCENT" | "FIXED"

// ==================== PRODUCT ====================

// Go API: GET /api/v1/products returns raw array
export interface Product {
  id: string
  supplierId: string | null
  name: string
  slug: string
  description: string | null
  image: string | null
  category: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

// Go API: GET /api/v1/products/:id includes variants
export interface ProductDetail extends Product {
  variants: Variant[]
}

export interface Variant {
  id: string
  productId: string
  name: string
  price: number
  supplierVariantId: string | null
  warrantyOptions: WarrantyOption[]
}

export interface WarrantyOption {
  id: string
  productId: string
  variantId: string | null
  duration: number
  price: number
  terms: string | null
}

// Extended product with computed metadata for store display
export interface ProductWithMeta extends Product {
  totalSold: number
  totalStock: number
  avgRating?: number
  reviewCount: number
  variants?: Variant[]
  pricePerDay?: number
  stockCount?: number
}

// Product with variants included (for store listings)
export interface ProductWithVariants extends Product {
  variants: Variant[]
}

// ==================== ORDER ====================

export interface Order {
  id: string
  orderNumber: string
  userId: string | null
  guestEmail: string | null
  guestName: string | null
  status: string
  paymentMethod: string | null
  paymentStatus: string
  xenditInvoiceId: string | null
  xenditPaymentUrl: string | null
  subtotal: number
  total: number
  deliveredAt: string | null
  createdAt: string | null
  updatedAt: string | null
  paidAt: string | null
  cancelReason: string | null
  productId: string | null
  voucherId: string | null
}

export interface OrderItem {
  id: string
  orderId: string
  variantId: string
  price: number
  quantity: number
  warrantyOptionId: string | null
  variant: Variant & { product: Pick<Product, "name" | "slug" | "image"> }
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  stocks?: Array<{ id: string; credentials: string; status: string }>
  warranty?: Warranty
}

// ==================== WARRANTY ====================

export interface Warranty {
  id: string
  userId: string
  orderId: string
  duration: number
  startDate: string | null
  expiryDate: string | null
  status: string
  order?: { items: OrderItem[] }
  claims?: WarrantyClaim[]
}

export interface WarrantyClaim {
  id: string
  warrantyId: string
  proofImageUrl: string | null
  claimReason: string | null
  status: string
  rejectionReason: string | null
  submittedAt: string | null
  reviewedAt: string | null
  variantId: string | null
  orderId: string | null
  orderItemId: string | null
  order?: { orderNumber: string; guestEmail: string | null; guestName: string | null }
  orderItem?: OrderItem & { variant: Variant & { product: { name: string } } }
}

export interface WarrantyClaimForm {
  orderId: string
  orderItemId: string
  description: string
  proofImage?: string
}

// ==================== REVIEW ====================

export interface Review {
  id: string
  productId: string
  orderId: string
  userId: string
  rating: number
  comment: string
  isVisible: boolean
  isPinned: boolean
  createdAt: string | null
  product?: { name: string }
  user?: { name: string | null }
}

export interface ReviewListResponse {
  reviews: Review[]
  stats: ReviewStats
}

export interface ReviewStats {
  totalReviews: number
  avgRating: number | null
  distribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
}

// ==================== ADMIN ====================

export interface AdminStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  activeWarranties: number
  lowStockItems: number
}

export interface AccountStock {
  id: string
  variantId: string
  credentials: string
  status: string
  supplierId: string | null
  orderId: string | null
  acquiredAt: string | null
  soldAt: string | null
}

export interface Voucher {
  id: string
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string | null
}

export interface Referral {
  id: string
  referrerId: string
  referrerEmail: string
  referredId: string | null
  referredEmail: string | null
  orderId: string | null
  commissionValue: number
  status: string
  createdAt: string | null
}

// ==================== AUTH ====================

export interface VerifyTokenResponse {
  valid: boolean
  sub?: string
  email?: string
  role?: string
  error?: string
}

// ==================== CHECKOUT ====================

export interface CheckoutFormData {
  guestName?: string
  guestEmail?: string
  customerName?: string
  customerEmail?: string
  userId?: string
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT"
  bankCode?: string
  items?: CartItem[]
  voucherCode?: string
}

// ==================== MISC ====================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface SocialProof {
  totalOrders: number
  totalTestimonials: number
  averageRating: number
}

export interface LiveActivityResponse {
  orders: { orderNumber: string; createdAt: string | null }[]
}

export interface RevenueChartEntry {
  date: string
  revenue: number
}