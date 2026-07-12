import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, name, items } = await request.json()
    if (!email || !items?.length) return NextResponse.json({ ok: true })

    // Upsert: if already exists for this email in last 24h, update items
    const existing = await db.abandonedCart.findFirst({
      where: { email, recovered: false, createdAt: { gte: new Date(Date.now() - 86400_000) } },
    })
    if (existing) {
      await db.abandonedCart.update({ where: { id: existing.id }, data: { items, name } })
    } else {
      await db.abandonedCart.create({ data: { email, name, items } })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // silent fail
  }
}
