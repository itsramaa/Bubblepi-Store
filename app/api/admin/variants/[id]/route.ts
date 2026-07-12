import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const variant = await db.variant.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: variant })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.variant.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
