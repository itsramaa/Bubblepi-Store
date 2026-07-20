import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import bcrypt from "bcryptjs"
import { db } from "./db"

const ADMIN_SECRET = new TextEncoder().encode(process.env.ADMIN_SECRET!)
const USER_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

const ADMIN_COOKIE_NAME = "admin-token"
const USER_COOKIE_NAME = "user-token"
const EXPIRY = "8h"

// ==================== ADMIN AUTH ====================

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(ADMIN_SECRET)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload.role === "admin"
  } catch {
    return false
  }
}

export function setAdminCookie(token: string) {
  return {
    name: ADMIN_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 8 * 60 * 60,
    },
  }
}

// ==================== USER AUTH ====================

export interface UserPayload extends JWTPayload {
  userId?: string
  email?: string
  role?: string
}

export async function signUserToken(userId: string, email: string, role: "USER" | "ADMIN"): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(USER_SECRET)
}

export async function verifyUserToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, USER_SECRET)
    return payload as UserPayload
  } catch {
    return null
  }
}

export function setUserCookie(token: string) {
  return {
    name: USER_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 8 * 60 * 60,
    },
  }
}

export function getUserTokenFromHeaders(headers: Headers): string | null {
  const cookie = headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(/user-token=([^;]+)/)
  return match?.[1] ?? null
}

export function getAdminTokenFromHeaders(headers: Headers): string | null {
  const cookie = headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(/admin-token=([^;]+)/)
  return match?.[1] ?? null
}

/**
 * Get current user from session cookie (for server components)
 */
export async function getUserFromSession() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_COOKIE_NAME)?.value
  if (!token) return null
  return verifyUserToken(token)
}

// ==================== HELPERS ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function clearUserCookie() {
  return {
    name: USER_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  }
}

export function clearAdminCookie() {
  return {
    name: ADMIN_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  }
}
