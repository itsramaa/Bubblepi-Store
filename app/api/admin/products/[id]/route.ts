import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: product })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const product = await db.product.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: product })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  await db.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
