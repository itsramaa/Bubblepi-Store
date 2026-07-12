import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

// Bulk fulfill all PENDING_STOCK orders
export async function POST() {
  const pending = await db.order.findMany({
    where: { status: "PENDING_STOCK" },
    select: { id: true, orderNumber: true },
  })

  if (pending.length === 0) {
    return NextResponse.json({ success: true, fulfilled: 0, message: "Tidak ada order PENDING_STOCK" })
  }

  let fulfilled = 0
  const errors: string[] = []

  for (const order of pending) {
    try {
      await fulfillOrder(order.id)
      fulfilled++
    } catch (e) {
      errors.push(`${order.orderNumber}: ${e instanceof Error ? e.message : "unknown"}`)
    }
  }

  return NextResponse.json({ success: true, fulfilled, total: pending.length, errors })
}
