import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { fulfillOrder } from "@/lib/order"

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "orderIds diperlukan" }, { status: 400 })
    }

    const results = await Promise.allSettled(
      orderIds.map((id: string) => fulfillOrder(id))
    )

    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    return NextResponse.json({ success: true, data: { succeeded, failed } })
  } catch (error) {
    console.error("Bulk fulfill error:", error)
    return NextResponse.json({ error: "Gagal bulk fulfill" }, { status: 500 })
  }
}
