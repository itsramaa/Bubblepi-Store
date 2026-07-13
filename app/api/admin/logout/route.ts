import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request); if (authError) return authError
  const response = NextResponse.json({ success: true })
  response.cookies.delete("admin-token")
  return response
}
