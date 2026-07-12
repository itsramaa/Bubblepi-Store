import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { searchParams } = request.nextUrl

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
