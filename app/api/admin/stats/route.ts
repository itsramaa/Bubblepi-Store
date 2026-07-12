import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const pending = await db.order.count({
    where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PAID", "PENDING_STOCK"] } },
  })
  return NextResponse.json({ pending })
}
