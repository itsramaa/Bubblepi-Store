import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { z } from "zod"

const eventSchema = z.object({
  sessionId: z.string().min(1).max(128),
  event: z.enum(["VIEW_PRODUCT", "ADD_TO_CART", "CHECKOUT_START", "PAYMENT_INITIATED", "PAYMENT_SUCCESS"]),
  productId: z.string().optional(),
  variantId: z.string().optional(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed } = checkRateLimit(`analytics:${ip}`, 100, 60_000)
  if (!allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 })

  try {
    const body = await request.json()
    const data = eventSchema.parse(body)
    // fire-and-forget — don't await
    db.funnelEvent.create({ data }).catch((err) => {
      console.error("Failed to log funnel event:", err)
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid event data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
