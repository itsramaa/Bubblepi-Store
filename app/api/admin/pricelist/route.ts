/**
 * Pricelist API
 */

import { NextResponse } from "next/server"
import { generatePricelist, exportPricelistJSON } from "@/lib/pricelist"
import { requireAdmin } from "@/lib/admin-auth"

import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") || "list"
  const minStock = parseInt(searchParams.get("minStock") || "0")
  const includeOutOfStock = searchParams.get("includeOutOfStock") === "true"
  const products = searchParams.get("products")?.split(",").filter(Boolean)

  try {
    if (format === "json") {
      const data = await exportPricelistJSON({ products, minStock, includeOutOfStock })
      return NextResponse.json(data)
    }

    const pricelist = await generatePricelist({
      products,
      minStock,
      includeOutOfStock,
      format: format as any,
    })

    return new Response(pricelist, { headers: { "Content-Type": "text/plain" } })
  } catch (error) {
    console.error("[Pricelist] Error:", error)
    return NextResponse.json({ error: "Failed to generate pricelist" }, { status: 500 })
  }
}