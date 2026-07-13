import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { variantId, credentials } = await request.json()
    if (!variantId || !Array.isArray(credentials) || credentials.length === 0) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const variant = await db.variant.findUnique({ where: { id: variantId } })
    if (!variant) return NextResponse.json({ error: "Variant tidak ditemukan" }, { status: 404 })

    const data = (credentials as string[])
      .map((c) => c.trim())
      .filter(Boolean)
      .map((credentials) => ({ variantId, credentials, status: "AVAILABLE" as const }))

    const result = await db.accountStock.createMany({ data, skipDuplicates: true })
    return NextResponse.json({ success: true, data: { inserted: result.count } })
  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json({ error: "Gagal upload" }, { status: 500 })
  }
}
