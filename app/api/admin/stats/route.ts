import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  const pending = await db.order.count({
    where: { status: { in: ["PENDING_STOCK", "AWAITING_PAYMENT", "PENDING"] } },
  })
  return NextResponse.json({ pending })
}
