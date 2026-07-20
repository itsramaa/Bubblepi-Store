/**
 * Admin Stats API
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const [
      totalOrders,
      pendingOrders,
      revenue,
      warrantyClaims,
      lowStockCount,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PROCESSING"] } } }),
      db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
      db.warrantyClaim.count({ where: { status: "PENDING_REVIEW" } }),
      db.accountStock.count({ where: { status: "AVAILABLE" } }),
    ])

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      revenue: revenue._sum.total || 0,
      warrantyClaims,
      lowStockCount,
    })
  } catch (error) {
    console.error("[Admin Stats] Error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}