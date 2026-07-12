import { NextRequest, NextResponse } from "next/server"
import { signAdminToken, setAdminCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const token = await signAdminToken()
  const cookie = setAdminCookie(token)

  const response = NextResponse.json({ success: true })
  response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])
  return response
}
