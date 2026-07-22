import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { searchParams, pathname } = request.nextUrl

  // Admin route protection — verify JWT from cookie, redirect to login if invalid
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = request.cookies.get("admin-token")
    if (!cookie) {
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
    try {
      const { payload } = await jwtVerify(cookie.value, JWT_SECRET)
      // Only ADMIN role can access admin routes
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", request.url))
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // UTM tracking cookies
  const utmSource = searchParams.get("utm_source")
  const utmMedium = searchParams.get("utm_medium")
  const utmCampaign = searchParams.get("utm_campaign")
  const ref = searchParams.get("ref")

  if (utmSource || utmMedium || utmCampaign) {
    const utmData = JSON.stringify({ utmSource, utmMedium, utmCampaign })
    response.cookies.set("utm_data", utmData, { maxAge: 60 * 60 * 24 * 30, path: "/" })
  }

  if (ref) {
    response.cookies.set("ref_code", ref, { maxAge: 60 * 60 * 24 * 30, path: "/" })
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)"],
}