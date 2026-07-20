/**
 * Stock Management
 */

import { db } from "@/lib/db"
import type { AccountStock } from "@prisma/client"

export type { AccountStock, StockStatus } from "@prisma/client"

const STOCK_STATUS = {
  AVAILABLE: "AVAILABLE",
  HOLD: "HOLD",
  SOLD: "SOLD",
} as const

/**
 * Get available stock for a variant
 */
export async function getAvailableStock(variantId: string): Promise<AccountStock[]> {
  return db.accountStock.findMany({
    where: {
      variantId,
      status: STOCK_STATUS.AVAILABLE,
    },
  })
}

/**
 * Get stock count for a variant
 */
export async function getStockCount(variantId: string): Promise<number> {
  return db.accountStock.count({
    where: {
      variantId,
      status: STOCK_STATUS.AVAILABLE,
    },
  })
}

/**
 * Lock stock (AVAILABLE → HOLD) for an order
 */
export async function lockStock(variantId: string, quantity: number, orderId: string): Promise<AccountStock[]> {
  const available = await db.accountStock.findMany({
    where: {
      variantId,
      status: STOCK_STATUS.AVAILABLE,
    },
    take: quantity,
  })

  if (available.length < quantity) {
    throw new Error(`Insufficient stock. Available: ${available.length}, requested: ${quantity}`)
  }

  const stockIds = available.map((s) => s.id)

  await db.accountStock.updateMany({
    where: { id: { in: stockIds } },
    data: { status: STOCK_STATUS.HOLD, orderId },
  })

  return db.accountStock.findMany({
    where: { id: { in: stockIds } },
  })
}

/**
 * Release stock (HOLD → AVAILABLE)
 */
export async function releaseStock(orderId: string): Promise<void> {
  await db.accountStock.updateMany({
    where: { orderId, status: STOCK_STATUS.HOLD },
    data: { status: STOCK_STATUS.AVAILABLE, orderId: null },
  })
}

/**
 * Mark stock as sold (HOLD → SOLD)
 */
export async function markStockSold(orderId: string): Promise<void> {
  await db.accountStock.updateMany({
    where: { orderId, status: STOCK_STATUS.HOLD },
    data: { 
      status: STOCK_STATUS.SOLD,
      soldAt: new Date(),
    },
  })
}

/**
 * Add new stock (admin)
 */
export async function addStock(variantId: string, credentials: string): Promise<AccountStock> {
  return db.accountStock.create({
    data: {
      variantId,
      credentials,
      status: STOCK_STATUS.AVAILABLE,
      acquiredAt: new Date(),
    },
  })
}

/**
 * Get low stock variants (for alerts)
 */
export async function getLowStockVariants(threshold = 5) {
  const variants = await db.variant.findMany({
    include: {
      stocks: {
        where: { status: STOCK_STATUS.AVAILABLE },
      },
      product: true,
    },
  })

  return variants.filter((v) => v.stocks.length <= threshold)
}

/**
 * Get critical stock (threshold <= 2)
 */
export async function getCriticalStock() {
  return getLowStockVariants(2)
}