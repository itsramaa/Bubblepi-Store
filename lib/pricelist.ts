/**
 * Pricelist Generation
 */

import { db } from "@/lib/db"

interface PricelistItem {
  product: string
  variant: string
  price: number
  stock: number
}

interface PricelistOptions {
  products?: string[] // product IDs to include
  minStock?: number
  includeOutOfStock?: boolean
  format?: "list" | "table" | "telegram"
}

/**
 * Generate pricelist data
 */
export async function generatePricelist(options: PricelistOptions = {}) {
  const { products, minStock = 0, includeOutOfStock = false, format = "list" } = options

  const whereClause: any = {}
  
  if (products?.length) {
    whereClause.productId = { in: products }
  }

  const variants = await db.variant.findMany({
    where: whereClause,
    include: {
      product: true,
      stocks: {
        where: minStock > 0 ? { status: "AVAILABLE" } : undefined,
      },
    },
  })

  let items: PricelistItem[] = variants.map((v) => ({
    product: v.product.name,
    variant: v.name,
    price: v.price,
    stock: v.stocks.length,
  }))

  if (!includeOutOfStock) {
    items = items.filter((i) => i.stock > 0)
  }

  if (minStock > 0) {
    items = items.filter((i) => i.stock >= minStock)
  }

  return formatPricelist(items, format)
}

/**
 * Format pricelist for different outputs
 */
function formatPricelist(items: PricelistItem[], format: string): string {
  switch (format) {
    case "telegram":
      return formatForTelegram(items)
    case "table":
      return formatAsTable(items)
    default:
      return formatAsList(items)
  }
}

function formatAsList(items: PricelistItem[]): string {
  return items
    .map((i) => `${i.product} - ${i.variant}\nHarga: Rp ${i.price.toLocaleString("id-ID")}\nStock: ${i.stock}\n`)
    .join("\n---\n\n")
}

function formatAsTable(items: PricelistItem[]): string {
  const header = "| Product | Variant | Price | Stock |\n|---------|---------|-------|-------|"
  const rows = items.map((i) => `| ${i.product} | ${i.variant} | Rp ${i.price.toLocaleString("id-ID")} | ${i.stock} |`)
  return [header, ...rows].join("\n")
}

function formatForTelegram(items: PricelistItem[]): string {
  const lines = ["📋 <b>DAFTAR HARGA</b>\n"]
  let currentProduct = ""

  for (const item of items) {
    if (item.product !== currentProduct) {
      lines.push(`\n<b>${item.product}</b>`)
      currentProduct = item.product
    }
    lines.push(`• ${item.variant}: Rp ${item.price.toLocaleString("id-ID")} (Stock: ${item.stock})`)
  }

  return lines.join("\n")
}

/**
 * Export pricelist as JSON
 */
export async function exportPricelistJSON(options: PricelistOptions = {}) {
  const variants = await db.variant.findMany({
    include: { product: true, stocks: true },
  })

  return variants.map((v) => ({
    product: v.product.name,
    variant: v.name,
    price: v.price,
    stock: v.stocks.filter((s) => s.status === "AVAILABLE").length,
  }))
}