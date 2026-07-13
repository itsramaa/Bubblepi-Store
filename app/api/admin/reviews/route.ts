import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError

  try {
    const { id, isVisible, isPinned } = await request.json()
    const data: Record<string, boolean> = {}
    if (isVisible !== undefined) data.isVisible = isVisible
    if (isPinned !== undefined) data.isPinned = isPinned
    await db.review.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
