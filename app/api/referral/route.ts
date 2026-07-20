import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/referral?email=xxx — get referral code for a customer
// POST /api/referral — create referral record when order fulfilled

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  // Referral code = base64url of email (deterministic, no extra table needed)
  const code = Buffer.from(email).toString("base64url")

  const referrals = await db.referral.findMany({
    where: { referrerEmail: email },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const earned = referrals.reduce((sum, r) => sum + r.commissionValue, 0)

  return NextResponse.json({ code, referrals, totalEarned: earned })
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, guestEmail: true, status: true },
    })

    if (!order || order.status !== "DELIVERED") {
      return NextResponse.json({ error: "Order not fulfilled" }, { status: 400 })
    }

    // Check if this order has a referral cookie (stored in order utm fields or cookies)
    const refCode = request.cookies.get("ref_code")?.value
    if (!refCode) return NextResponse.json({ skipped: true })

    const referrerEmail = Buffer.from(refCode, "base64url").toString("utf-8")
    if (referrerEmail === order.guestEmail) return NextResponse.json({ skipped: true })

    // Avoid duplicate referral for same order
    const existing = await db.referral.findFirst({ where: { orderId } })
    if (existing) return NextResponse.json({ skipped: true })

    const referral = await db.referral.create({
      data: {
        referrerEmail,
        referredEmail: order.guestEmail ?? "unknown@email.com",
        orderId,
        commissionValue: 5000,
        status: "CONFIRMED",
      },
    })

    return NextResponse.json({ success: true, referral })
  } catch (err) {
    console.error("Referral error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
