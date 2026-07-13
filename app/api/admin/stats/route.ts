import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [todayRevenue, weekRevenue, monthRevenue, pendingCount] = await Promise.all([
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: todayStart }, status: "FULFILLED" } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: weekStart }, status: "FULFILLED" } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: monthStart }, status: "FULFILLED" } }),
    db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PENDING_STOCK"] } } }),
  ])

  const lowStockVariants = await db.$queryRaw<Array<{ id: string; name: string; available: bigint }>>`
    SELECT v.id, v.name, COUNT(as_.id) as available
    FROM "Variant" v
    LEFT JOIN "AccountStock" as_ ON as_."variantId" = v.id AND as_.status = 'AVAILABLE'
    GROUP BY v.id, v.name
    HAVING COUNT(as_.id) < 3
    ORDER BY available ASC
    LIMIT 20
  `

  return NextResponse.json({
    pending: pendingCount,
    revenue: {
      today: todayRevenue._sum.total ?? 0,
      week: weekRevenue._sum.total ?? 0,
      month: monthRevenue._sum.total ?? 0,
    },
    lowStockVariants: lowStockVariants.map((v) => ({ ...v, available: Number(v.available) })),
  })
}
