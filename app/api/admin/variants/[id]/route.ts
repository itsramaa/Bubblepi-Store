import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const variant = await db.variant.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: variant })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  await db.variant.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
