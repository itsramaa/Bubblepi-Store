import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  variantId: z.string().min(1, "Variant ID required"),
  targetPrice: z.number().int().positive().optional(),
})

// Rate limiter: 10 requests per minute per IP (ponytail: use Redis for production)
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, variantId, targetPrice } = schema.parse(body)

    const variant = await db.variant.findUnique({ where: { id: variantId } })
    if (!variant) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 })
    }

    await db.priceDropNotification.upsert({
      where: {
        email_variantId: { email, variantId },
      },
      create: { email, variantId, targetPrice: targetPrice ?? null },
      update: { targetPrice: targetPrice ?? null, notified: false },
    })

    return NextResponse.json({
      success: true,
      message: "Kami akan memberitahu kamu saat harga turun!",
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
