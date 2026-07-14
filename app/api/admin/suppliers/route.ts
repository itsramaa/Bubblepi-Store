import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError
  const bots = await db.supplierBot.findMany({
    include: { products: { include: { variant: { include: { product: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(bots)
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { label, botUsername, serviceUrl } = await request.json()
  if (!label || !botUsername || !serviceUrl) {
    return NextResponse.json({ error: "label, botUsername, serviceUrl required" }, { status: 400 })
  }
  const bot = await db.supplierBot.create({ data: { label, botUsername, serviceUrl } })
  return NextResponse.json(bot, { status: 201 })
}
