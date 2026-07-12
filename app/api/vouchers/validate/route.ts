import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { code, total } = await request.json()
  if (!code) return NextResponse.json({ error: "Kode voucher diperlukan" }, { status: 400 })

  const voucher = await db.voucher.findUnique({ where: { code: code.toUpperCase() } })
  if (!voucher || !voucher.isActive) return NextResponse.json({ error: "Kode voucher tidak valid" }, { status: 404 })
  if (voucher.expiresAt && voucher.expiresAt < new Date()) return NextResponse.json({ error: "Voucher sudah kedaluwarsa" }, { status: 400 })
  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) return NextResponse.json({ error: "Voucher sudah habis" }, { status: 400 })
  if (total < voucher.minOrder) return NextResponse.json({ error: `Minimum order ${voucher.minOrder.toLocaleString("id-ID")}` }, { status: 400 })

  const discount = voucher.type === "PERCENT"
    ? Math.round(total * voucher.value / 100)
    : voucher.value

  return NextResponse.json({ valid: true, voucher: { id: voucher.id, code: voucher.code, type: voucher.type, value: voucher.value, discount } })
}
