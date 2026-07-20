import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  try {
    const { id, action, note } = await request.json()
    const claim = await db.warrantyClaim.findUnique({
      where: { id },
      include: { order: { include: { items: { include: { variant: { include: { product: true } } } } } }, orderItem: { include: { variant: { include: { product: true } } } } },
    })
    if (!claim) return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 })

    if (action === "approve") {
      if (!claim.orderItem) return NextResponse.json({ error: "orderItem not found" }, { status: 400 })
      const replacement = await db.accountStock.findFirst({
        where: { variantId: claim.orderItem.variantId, status: "AVAILABLE" },
      })
      if (!replacement) return NextResponse.json({ error: "Stok pengganti tidak tersedia" }, { status: 400 })

      await db.warrantyClaim.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date() },
      })
      await db.accountStock.update({
        where: { id: replacement.id },
        data: { status: "SOLD", orderId: claim.orderId },
      })
      if (!claim.order) return NextResponse.json({ error: "order not found" }, { status: 400 })
      await sendAccountDelivery({
        to: claim.order.guestEmail ?? "unknown@email.com",
        orderNumber: claim.order.orderNumber,
        orderId: claim.orderId ?? "unknown",
        items: [{
          name: claim.orderItem.variant.product.name + " (" + claim.orderItem.variant.name + ")",
          credentials: [replacement.credentials],
        }],
      })
    } else if (action === "reject") {
      await db.warrantyClaim.update({
        where: { id },
        data: { status: "REJECTED", rejectionReason: note, reviewedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
