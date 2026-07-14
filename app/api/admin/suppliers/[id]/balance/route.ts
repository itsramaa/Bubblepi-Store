import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const bot = await db.supplierBot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 })

  const token = process.env.SUPPLIER_BOT_TOKEN ?? "dev-token-change-me"
  const res = await fetch(`${bot.serviceUrl}/api/v1/bots/${bot.botUsername}/balance`, {
    headers: { "X-Internal-Token": token },
    signal: AbortSignal.timeout(15000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
