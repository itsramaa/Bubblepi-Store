import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const bot = await db.supplierBot.findUnique({
    where: { id },
    include: { products: { include: { variant: { include: { product: true } } } } },
  })
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json(bot)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const data = await request.json()
  const bot = await db.supplierBot.update({ where: { id }, data })
  return NextResponse.json(bot)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  await db.supplierBot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
