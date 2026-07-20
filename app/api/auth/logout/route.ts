import { NextResponse } from "next/server"
import { clearUserCookie } from "@/lib/auth"

export async function POST() {
  const response = NextResponse.json({ success: true })

  const cookie = clearUserCookie()
  response.cookies.set(cookie.name, cookie.value, cookie.options)

  return response
}