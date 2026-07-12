import { SignJWT, jwtVerify } from "jose"

const ADMIN_SECRET = new TextEncoder().encode(process.env.ADMIN_SECRET!)
const COOKIE_NAME = "admin-token"
const EXPIRY = "8h"

export async function signAdminToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(ADMIN_SECRET)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, ADMIN_SECRET)
    return true
  } catch {
    return false
  }
}

export function setAdminCookie(token: string): {
  name: string
  value: string
  options: Record<string, unknown>
} {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    },
  }
}

export function getAdminTokenFromHeaders(headers: Headers): string | null {
  const cookie = headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(/admin-token=([^;]+)/)
  return match?.[1] ?? null
}
