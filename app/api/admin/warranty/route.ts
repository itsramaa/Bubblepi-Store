import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendAccountDelivery } from "@/lib/mailer"

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, note } = await request.json()
    const claim = await db.warrantyClaim.findUnique({
      where: { id },
      include: { order: { include: { items: { include: { variant: { include: { product: true } } } } } }, orderItem: { include: { variant: { include: { product: true } } } } },
    })
    if (!claim) return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 })

    if (action === "approve") {
      // Find replacement stock
      const replacement = await db.accountStock.findFirst({
        where: { variantId: claim.orderItem.variantId, status: "AVAILABLE" },
      })
      if (!replacement) return NextResponse.json({ error: "Stok pengganti tidak tersedia" }, { status: 400 })

      // Mark claim approved
      await db.warrantyClaim.update({
        where: { id },
        data: { status: "APPROVED", resolvedAt: new Date() },
      })
      // Mark replacement stock as assigned to this order
      await db.accountStock.update({
        where: { id: replacement.id },
        data: { status: "ASSIGNED", orderId: claim.orderId },
      })
      // Send new credentials
      await sendAccountDelivery({
        to: claim.order.customerEmail,
        orderNumber: claim.order.orderNumber,
        orderId: claim.orderId,
        items: [{
          name: claim.orderItem.variant.product.name + " (" + claim.orderItem.variant.name + ")",
          credentials: [replacement.credentials],
        }],
      })
    } else if (action === "reject") {
      await db.warrantyClaim.update({
        where: { id },
        data: { status: "REJECTED", resolveNote: note, resolvedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
