import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/crypto"

const MAX_CREDENTIALS = 500

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  try {
    const { variantId, credentials } = await request.json()
    if (!variantId || !Array.isArray(credentials) || credentials.length === 0) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const variant = await db.variant.findUnique({ where: { id: variantId } })
    if (!variant) return NextResponse.json({ error: "Variant tidak ditemukan" }, { status: 404 })

    // Dedupe and clean incoming list
    const cleaned = [...new Set(
      (credentials as string[]).map((c) => c.trim()).filter(Boolean)
    )]

    const total_submitted = cleaned.length

    if (total_submitted > MAX_CREDENTIALS) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_CREDENTIALS} kredensial per upload. Dikirim: ${total_submitted}` },
        { status: 400 }
      )
    }

    // Check which credentials already exist in DB for this variant
    const encrypted = cleaned.map((c) => encrypt(c))

    const existing = await db.accountStock.findMany({
      where: { variantId, credentials: { in: encrypted } },
      select: { credentials: true },
    })
    const existingSet = new Set(existing.map((e) => e.credentials))

    const newData = cleaned
      .map((c) => ({ raw: c, enc: encrypt(c) }))
      .filter(({ enc }) => !existingSet.has(enc))
      .map(({ enc }) => ({ variantId, credentials: enc, status: "AVAILABLE" as const }))

    const skipped_duplicates = total_submitted - newData.length

    const result = await db.accountStock.createMany({ data: newData, skipDuplicates: true })

    return NextResponse.json({
      success: true,
      data: {
        inserted: result.count,
        skipped_duplicates,
        total_submitted,
      },
    })
  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json({ error: "Gagal upload" }, { status: 500 })
  }
}
