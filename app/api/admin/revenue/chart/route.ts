import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const orders = await db.order.findMany({
    where: { status: "FULFILLED", paidAt: { gte: thirtyDaysAgo } },
    select: { paidAt: true, total: true },
    orderBy: { paidAt: "asc" },
  })

  // Group by date
  const byDate: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    byDate[d.toISOString().slice(0, 10)] = 0
  }
  for (const o of orders) {
    if (!o.paidAt) continue
    const key = new Date(o.paidAt).toISOString().slice(0, 10)
    if (key in byDate) byDate[key] += o.total
  }

  const data = Object.entries(byDate).map(([date, revenue]) => ({ date, revenue }))
  return NextResponse.json({ success: true, data })
}
