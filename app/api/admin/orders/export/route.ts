import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { variant: { include: { product: true } } } } },
  })

  const header = [
    "OrderNumber", "CustomerEmail", "CustomerName", "Status",
    "Total", "DiscountAmount", "PaymentMethod", "CreatedAt", "PaidAt", "Items",
  ].join(",")

  const rows = orders.map((o) => {
    const items = o.items
      .map((i) => `${i.variant.product.name} (${i.variant.name}) x${i.quantity}`)
      .join("; ")
    return [
      csvEscape(o.orderNumber),
      csvEscape(o.customerEmail),
      csvEscape(o.customerName),
      csvEscape(o.status),
      csvEscape(o.total),
      csvEscape(o.discountAmount),
      csvEscape(o.paymentMethod),
      csvEscape(o.createdAt.toISOString()),
      csvEscape(o.paidAt?.toISOString()),
      csvEscape(items),
    ].join(",")
  })

  const csv = [header, ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export.csv"`,
    },
  })
}
