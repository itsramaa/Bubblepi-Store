import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken, getAdminTokenFromHeaders } from "@/lib/auth"

/**
 * Reusable guard for admin API routes.
 * Usage: const authError = await requireAdmin(request); if (authError) return authError;
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = getAdminTokenFromHeaders(request.headers)
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const valid = await verifyAdminToken(token)
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

/**
 * Reusable guard for cron routes.
 * Checks CRON_SECRET header sent by Vercel or Hermes scheduler.
 */
export function requireCronSecret(request: NextRequest): NextResponse | null {
  const secret = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret")
  const expected = process.env.CRON_SECRET
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
