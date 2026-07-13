import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids")
  if (!ids) return NextResponse.json({})

  const variantIds = ids.split(",").filter(Boolean)
  if (variantIds.length === 0) return NextResponse.json({})

  const counts = await db.accountStock.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, status: "AVAILABLE" },
    _count: { id: true },
  })

  const result: Record<string, number> = {}
  for (const row of counts) {
    result[row.variantId] = row._count.id
  }
  // Variants with zero stock won't appear in groupBy — set them explicitly
  for (const id of variantIds) {
    if (!(id in result)) result[id] = 0
  }

  return NextResponse.json(result)
}
