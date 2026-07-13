import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request)
  if (cronError) return cronError

  // Find fulfilled orders with failed email sends (resendCount > 0, max 5 retries)
  const orders = await db.order.findMany({
    where: {
      status: "FULFILLED",
      resendCount: { gt: 0, lt: 5 },
    },
    take: 20,
    include: { items: { include: { variant: true } } },
  })

  // ponytail: retry logic — currently just reports count
  // upgrade path: call sendAccountDelivery() for each and reset resendCount on success
  console.log(`[retry-emails] ${orders.length} orders need email retry`)

  return NextResponse.json({ retried: orders.length })
}
