import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { sendLowStockAlert } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request)
  if (cronError) return cronError

  const lowStock = await db.$queryRaw<
    Array<{ id: string; name: string; available: bigint; productName: string }>
  >`
    SELECT v.id, v.name, p.name as "productName", COUNT(as_.id) as available
    FROM "Variant" v
    JOIN "Product" p ON p.id = v."productId"
    LEFT JOIN "AccountStock" as_ ON as_."variantId" = v.id AND as_.status = 'AVAILABLE'
    GROUP BY v.id, v.name, p.name
    HAVING COUNT(as_.id) < 3
    ORDER BY available ASC
    LIMIT 20
  `

  if (lowStock.length > 0) {
    const adminEmail = process.env.RESEND_FROM_EMAIL!
    await sendLowStockAlert({
      to: adminEmail,
      variants: lowStock.map((r) => ({
        name: r.name,
        productName: r.productName,
        available: Number(r.available),
      })),
    }).catch((err) => console.error("Low stocks alert failed:", err))
  }

  return NextResponse.json({
    alertSent: lowStock.length > 0,
    variantsCount: lowStock.length,
  })
}
