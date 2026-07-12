import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: true } },
      stocks: true,
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: order })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const order = await db.order.update({ where: { id }, data: { status: body.status } })
  return NextResponse.json({ success: true, data: order })
}
