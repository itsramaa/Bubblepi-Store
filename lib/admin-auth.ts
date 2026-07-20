import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken, getAdminTokenFromHeaders, verifyUserToken, getUserTokenFromHeaders, type UserPayload } from "@/lib/auth"

/**
 * Guard for admin API routes.
 * Usage: const authError = await requireAdmin(request); if (authError) return authError;
 */
export async function requireAdmin(request: Request | NextRequest): Promise<NextResponse | null> {
  const token = request.headers.get("cookie")?.match(/admin-token=([^;]+)/)?.[1]
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
 * Guard for user (logged in) API routes.
 * Returns user payload if valid, or error response.
 */
export async function requireUser(request: NextRequest): Promise<{ error: NextResponse } | { user: UserPayload }> {
  const token = getUserTokenFromHeaders(request.headers)
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const payload = await verifyUserToken(token)
  if (!payload) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user: payload }
}

/**
 * Optional user auth - returns user if token exists and valid, or null if guest.
 */
export async function optionalUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getUserTokenFromHeaders(request.headers)
  if (!token) return null
  return verifyUserToken(token)
}

/**
 * Guard for cron routes.
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
