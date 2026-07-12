import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get("status") ?? undefined
  const search = searchParams.get("search") ?? undefined

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ]
  }

  const orders = await db.order.findMany({
    where,
    include: { items: { include: { variant: { include: { product: { select: { name: true } } } } } } },
    orderBy: { createdAt: "desc" },
  })

  const rows = [
    ["Order#", "Nama", "Email", "Status", "Metode Bayar", "Total", "Dibuat", "Dibayar", "Items"].join(","),
    ...orders.map((o) => {
      const items = o.items.map((i) => `${i.variant.product.name} ${i.variant.name} x${i.quantity}`).join("; ")
      return [
        o.orderNumber,
        `"${o.customerName}"`,
        o.customerEmail,
        o.status,
        o.paymentMethod ?? "-",
        o.total,
        new Date(o.createdAt).toLocaleString("id-ID"),
        o.paidAt ? new Date(o.paidAt).toLocaleString("id-ID") : "-",
        `"${items}"`,
      ].join(",")
    }),
  ].join("\n")

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
