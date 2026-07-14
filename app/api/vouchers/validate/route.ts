import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`voucher-validate:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfter),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    )
  }

  const { code, cartTotal } = await request.json() as { code?: string; cartTotal?: number }
  if (!code) return NextResponse.json({ error: "Kode voucher diperlukan" }, { status: 400 })

  // Enhancement 5: trim + toUpperCase
  const normalizedCode = code.trim().toUpperCase()

  const voucher = await db.voucher.findUnique({ where: { code: normalizedCode } })
  if (!voucher || !voucher.isActive) return NextResponse.json({ valid: false, error: "Kode voucher tidak valid" }, { status: 404 })
  if (voucher.expiresAt && voucher.expiresAt < new Date()) return NextResponse.json({ valid: false, error: "Voucher sudah kedaluwarsa" }, { status: 400 })
  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) return NextResponse.json({ valid: false, error: "Voucher sudah habis" }, { status: 400 })
  if ((cartTotal ?? 0) < voucher.minOrder) return NextResponse.json({ valid: false, error: `Minimum order ${voucher.minOrder.toLocaleString("id-ID")}` }, { status: 400 })

  const discount = voucher.type === "PERCENT"
    ? Math.round((cartTotal ?? 0) * voucher.value / 100)
    : voucher.value

  return NextResponse.json(
    { valid: true, discount, voucherId: voucher.id, type: voucher.type, value: voucher.value },
    {
      headers: {
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    }
  )
}
