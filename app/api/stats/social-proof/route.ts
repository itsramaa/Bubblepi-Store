import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const totalBuyers = await db.order.groupBy({
    by: ["guestEmail"],
    where: { status: "DELIVERED" },
    _count: { id: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaySales = await db.order.count({
    where: { status: "DELIVERED", paidAt: { gte: today } },
  })

  const lastSold = await db.accountStock.findFirst({
    where: { status: "SOLD" },
    orderBy: { acquiredAt: "desc" },
    select: { acquiredAt: true },
  })

  const lastFulfillMins = lastSold?.acquiredAt
    ? Math.floor((Date.now() - new Date(lastSold.acquiredAt).getTime()) / 60000)
    : 0

  return NextResponse.json({
    totalBuyers: totalBuyers.length,
    todaySales,
    lastFulfillMins,
  })
}
