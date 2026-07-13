import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { variant: { include: { product: true } } } } },
  })

  const rows = [
    ["Order Number", "Nama", "Email", "Status", "Total", "Metode Bayar", "Tanggal", "Produk"].join(","),
    ...orders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.customerEmail,
      o.status,
      o.total,
      o.paymentMethod ?? "",
      new Date(o.createdAt).toLocaleDateString("id-ID"),
      `"${o.items.map((i) => `${i.variant.product.name} (${i.variant.name}) x${i.quantity}`).join("; ")}"`,
    ].join(",")),
  ].join("\n")

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  })
}
