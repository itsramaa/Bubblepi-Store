import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes except login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin-token")?.value
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth") {
    const token = request.cookies.get("admin-token")?.value
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
