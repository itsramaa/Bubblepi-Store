import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const pending = await db.order.count({
    where: { status: { in: ["PENDING_STOCK", "AWAITING_PAYMENT", "PENDING"] } },
  })
  return NextResponse.json({ pending })
}
