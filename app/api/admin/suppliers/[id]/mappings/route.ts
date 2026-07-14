import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const mappings = await db.supplierProduct.findMany({
    where: { supplierBotId: id },
    include: { variant: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(mappings)
}

export async function POST(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const { variantId, productNo, productBotId, variantBotId, label } = await request.json()
  if (!variantId || !productNo || !productBotId || !variantBotId || !label) {
    return NextResponse.json({ error: "variantId, productNo, productBotId, variantBotId, label required" }, { status: 400 })
  }
  const mapping = await db.supplierProduct.create({
    data: { supplierBotId: id, variantId, productNo, productBotId, variantBotId, label },
    include: { variant: { include: { product: true } } },
  })
  return NextResponse.json(mapping, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin(request); if (authError) return authError
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const mappingId = searchParams.get("mappingId")
  if (!mappingId) return NextResponse.json({ error: "mappingId required" }, { status: 400 })
  await db.supplierProduct.deleteMany({ where: { id: mappingId, supplierBotId: id } })
  return NextResponse.json({ ok: true })
}
