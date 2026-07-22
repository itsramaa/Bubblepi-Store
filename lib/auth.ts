import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")

export interface SessionUser {
  userId: string
  email: string
  role: string
}

export async function getUserFromSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("user-token")?.value ?? cookieStore.get("admin-token")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.sub ?? "",
      email: (payload.email as string) ?? "",
      role: (payload.role as string) ?? "USER",
    }
  } catch {
    return null
  }
}