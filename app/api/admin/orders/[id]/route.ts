import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

const ALLOWED_STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED", "FAILED", "PENDING_STOCK"] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        stocks: true,
      },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("GET /api/admin/orders/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    if (body.action === "fulfill") {
      await fulfillOrder(id)
      return NextResponse.json({ success: true })
    }

    if (body.action === "cancel") {
      const order = await db.order.findUnique({ where: { id } })
      if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
      if (["FULFILLED", "FAILED"].includes(order.status)) {
        return NextResponse.json({ error: "Order sudah terminal" }, { status: 400 })
      }
      await db.order.update({
        where: { id },
        data: { status: "FAILED", cancelReason: body.reason ?? "Dibatalkan admin" },
      })
      return NextResponse.json({ success: true })
    }

    // Generic status update — validate against allowlist
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    const order = await db.order.update({ where: { id }, data: { status: body.status } })
    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
