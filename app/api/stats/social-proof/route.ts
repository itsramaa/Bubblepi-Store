import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const totalBuyers = await db.order.groupBy({
    by: ["customerEmail"],
    where: { status: "FULFILLED" },
    _count: { id: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaySales = await db.order.count({
    where: { status: "FULFILLED", paidAt: { gte: today } },
  })

  const lastDelivered = await db.accountStock.findFirst({
    where: { status: "DELIVERED" },
    orderBy: { assignedAt: "desc" },
    select: { assignedAt: true },
  })

  const lastFulfillMins = lastDelivered?.assignedAt
    ? Math.floor((Date.now() - new Date(lastDelivered.assignedAt).getTime()) / 60000)
    : 0

  return NextResponse.json({
    totalBuyers: totalBuyers.length,
    todaySales,
    lastFulfillMins,
  })
}
