import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, type, value, minOrder, maxUses, expiresAt } = body
    if (!code) return NextResponse.json({ error: "Kode diperlukan" }, { status: 400 })

    const existing = await db.voucher.findUnique({ where: { code } })
    if (existing) return NextResponse.json({ error: "Kode sudah digunakan" }, { status: 409 })

    const voucher = await db.voucher.create({
      data: { code, type, value: parseInt(value), minOrder: parseInt(minOrder) || 0, maxUses: maxUses || null, expiresAt: expiresAt || null },
    })
    return NextResponse.json({ success: true, voucher }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isActive } = await request.json()
    await db.voucher.update({ where: { id }, data: { isActive } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
