import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const { id, isVisible, isPinned } = await request.json()
    const data: any = {}
    if (isVisible !== undefined) data.isVisible = isVisible
    if (isPinned !== undefined) data.isPinned = isPinned
    await db.review.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
