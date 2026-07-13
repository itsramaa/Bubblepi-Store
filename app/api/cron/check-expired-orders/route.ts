import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request)
  if (cronError) return cronError

  const expiredAt = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
  const result = await db.order.updateMany({
    where: {
      status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      createdAt: { lt: expiredAt },
    },
    data: { status: "FAILED" },
  })

  return NextResponse.json({ expired: result.count })
}
