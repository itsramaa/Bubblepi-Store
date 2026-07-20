/**
 * Google Sheets Sync
 * Syncs products/prices/variants from Google Sheets
 * Simplified version - no Category dependency
 */

import { db } from "@/lib/db"

// Lazy load googleapis to avoid build errors if not configured
let google: any = null
async function getGoogle() {
  if (!google) {
    const { google: g } = await import("googleapis")
    google = g
  }
  return google
}

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

interface SheetRow {
  productName: string
  variantName: string
  price: number
  description?: string
}

/**
 * Read data from Google Sheet
 */
export async function readSheet(spreadsheetId: string, range: string): Promise<SheetRow[]> {
  const googleAuth = await getGoogle()
  
  const auth = new googleAuth.google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  })

  const sheets = googleAuth.google.sheets({ version: "v4", auth })
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  const rows = response.data.values || []
  if (rows.length < 2) return [] // No data

  // Skip header row
  const data = rows.slice(1)
  
  return data.map((row: string[]) => ({
    productName: row[0]?.trim() || "",
    variantName: row[1]?.trim() || "",
    price: parseInt(row[2]) || 0,
    description: row[3]?.trim(),
  })).filter((r: SheetRow) => r.productName && r.variantName)
}

/**
 * Sync products from Google Sheet
 */
export async function syncFromSheet(spreadsheetId: string, sheetRange: string): Promise<{
  products: number
  variants: number
  errors: string[]
}> {
  const rows = await readSheet(spreadsheetId, sheetRange)
  const errors: string[] = []
  
  let productsCreated = 0
  let variantsCreated = 0

  // Group by product
  const productMap = new Map<string, SheetRow[]>()
  for (const row of rows) {
    const existing = productMap.get(row.productName) || []
    existing.push(row)
    productMap.set(row.productName, existing)
  }

  // Upsert products and variants
  for (const [productName, variants] of productMap) {
    try {
      const slug = productName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

      // Find or create product
      let product = await db.product.findFirst({
        where: { slug },
      })

      if (!product) {
        product = await db.product.create({
          data: {
            name: productName,
            slug,
            description: variants[0].description || "",
          },
        })
        productsCreated++
      }

      // Upsert variants
      for (const variant of variants) {
        const variantSlug = variant.variantName.toLowerCase().replace(/\s+/g, "-")
        
        const existingVariant = await db.variant.findFirst({
          where: { 
            productId: product.id,
            name: { equals: variant.variantName, mode: "insensitive" },
          },
        })

        if (!existingVariant) {
          await db.variant.create({
            data: {
              productId: product.id,
              name: variant.variantName,
              price: variant.price,
            },
          })
          variantsCreated++
        } else if (existingVariant.price !== variant.price) {
          // Update price if changed
          await db.variant.update({
            where: { id: existingVariant.id },
            data: { price: variant.price },
          })
        }
      }
    } catch (error) {
      errors.push(`Failed to sync ${productName}: ${error}`)
    }
  }

  return { products: productsCreated, variants: variantsCreated, errors }
}

/**
 * Get sync status
 */
export async function getLastSyncTime(): Promise<Date | null> {
  return null
}