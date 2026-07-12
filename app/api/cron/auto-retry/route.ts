import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

export const dynamic = "force-dynamic"

export async function GET() {
  const pending = await db.order.findMany({
    where: { status: "PENDING_STOCK" },
    select: { id: true },
  })
  let fulfilled = 0
  for (const order of pending) {
    try {
      await fulfillOrder(order.id)
      fulfilled++
    } catch {}
  }
  return NextResponse.json({ fulfilled, checked: pending.length })
}
