import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError
  const bots = await db.supplier.findMany({
    include: { products: { include: { variant: { include: { product: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(bots)
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { name, type, botUsername, serviceUrl, botToken, apiKey } = await request.json()
  if (!name || !type) {
    return NextResponse.json({ error: "name, type required" }, { status: 400 })
  }
  const config = { botUsername, serviceUrl, botToken, apiKey }
  const bot = await db.supplier.create({ 
    data: { 
      name, 
      type: type === "API" ? "API" : "TELEGRAM_BOT",
      config: config as any
    } 
  })
  return NextResponse.json(bot, { status: 201 })
}
