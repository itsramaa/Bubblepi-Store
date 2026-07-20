import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const { amount } = await request.json()
  if (!amount || amount < 1000) {
    return NextResponse.json({ error: "amount minimum 1000" }, { status: 400 })
  }

  const bot = await db.supplier.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 })

  const config = bot.config as { serviceUrl?: string; botUsername?: string; botToken?: string }
  const serviceUrl = config?.serviceUrl ?? "http://localhost:8082"
  const botUsername = config?.botUsername ?? "default"
  const token = config?.botToken ?? process.env.SUPPLIER_BOT_TOKEN ?? "dev-token"

  const res = await fetch(`${serviceUrl}/api/v1/bots/${botUsername}/topup`, {
    method: "POST",
    headers: { "X-Internal-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ bot_id: botUsername, amount }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
