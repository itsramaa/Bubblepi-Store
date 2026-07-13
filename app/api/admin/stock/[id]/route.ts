import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  const item = await db.accountStock.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      ...item,
      credentials: isEncrypted(item.credentials) ? decrypt(item.credentials) : item.credentials,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  const body = await request.json()

  // Encrypt credentials if provided in plaintext
  if (typeof body.credentials === "string" && !isEncrypted(body.credentials)) {
    body.credentials = encrypt(body.credentials)
  }

  const item = await db.accountStock.update({ where: { id }, data: body })
  return NextResponse.json({ success: true, data: item })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request); if (authError) return authError

  const { id } = await params
  await db.accountStock.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
