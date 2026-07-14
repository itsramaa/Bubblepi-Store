import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { generateOrderId } from "@/lib/utils"
import { sendTelegramNotification } from "@/lib/telegram"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { checkoutSchema } from "@/lib/validators"
import type { PrismaClient } from "@prisma/client"

// No PPN/tax — Xendit fee (QRIS 0.7%, VA Rp 4.000) ditanggung Xendit, tidak ditambahkan ke total

// Enhancement 1: Idempotency key store (in-memory, TTL 10 menit)
// ponytail: replace with Redis for multi-instance support
const idempotencyStore = new Map<string, { orderId: string; orderNumber: string; total: number; createdAt: number }>()
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [key, val] of idempotencyStore) {
    if (val.createdAt < cutoff) idempotencyStore.delete(key)
  }
}, 60_000).unref()

// Enhancement 2: Collision-safe order number
async function generateUniqueOrderNumber(tx: PrismaClient): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const num = generateOrderId()
    const existing = await tx.order.findUnique({ where: { orderNumber: num } })
    if (!existing) return num
  }
  throw new Error("Failed to generate unique order number")
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = checkRateLimit(`create-order:${ip}`, 10, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    // Enhancement 1: Idempotency key support
    const idempotencyKey = request.headers.get("Idempotency-Key")
    if (idempotencyKey) {
      const cached = idempotencyStore.get(idempotencyKey)
      if (cached && Date.now() - cached.createdAt < 10 * 60 * 1000) {
        return NextResponse.json({
          success: true,
          data: { orderId: cached.orderId, orderNumber: cached.orderNumber, total: cached.total },
        })
      }
    }

    const body = await request.json()

    // Fix 1: Validasi schema (email format, nama minimum)
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      )
    }

    const { customerName, customerEmail } = parsed.data
    const { items, voucherId, discountAmount } = body

    if (!items?.length) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Fix 1: Validasi quantity >= 1
    for (const item of items as { variantId: string; quantity: number }[]) {
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: "Quantity harus minimal 1" }, { status: 400 })
      }
    }

    const variantIds = items.map((i: { variantId: string }) => i.variantId)
    const variants = await db.variant.findMany({
      where: { id: { in: variantIds } },
    })

    let subtotal = 0
    const orderItems = items.map((item: { variantId: string; quantity: number }) => {
      const variant = variants.find((v: { id: string }) => v.id === item.variantId)
      if (!variant) throw new Error(`Variant ${item.variantId} not found`)
      subtotal += variant.price * item.quantity
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.price,
      }
    })

    const discount = discountAmount ?? 0
    const total = Math.max(subtotal - discount, 0)

    // UTM tracking + referral code
    let utmSource: string | null = null
    let utmMedium: string | null = null
    let utmCampaign: string | null = null
    let refCode: string | null = null
    try {
      const cookieStore = await cookies()
      const utmRaw = cookieStore.get("utm_data")?.value
      if (utmRaw) {
        const utm = JSON.parse(utmRaw) as { utmSource?: string; utmMedium?: string; utmCampaign?: string }
        utmSource = utm.utmSource ?? null
        utmMedium = utm.utmMedium ?? null
        utmCampaign = utm.utmCampaign ?? null
      }
      refCode = cookieStore.get("ref_code")?.value ?? null
    } catch {}

    // Fix 2: Voucher atomic transaction — cegah race condition
    if (voucherId) {
      try {
        await db.$transaction(async (tx) => {
          const voucher = await tx.voucher.findUnique({ where: { id: voucherId as string } })
          if (!voucher || !voucher.isActive) throw new Error("Voucher tidak valid")
          if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
            throw new Error("Voucher sudah habis")
          }
        })
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Voucher tidak valid" },
          { status: 400 }
        )
      }
    }

    const order = await db.$transaction(async (tx) => {
      const orderNumber = await generateUniqueOrderNumber(tx as unknown as PrismaClient)

      // Fix 2: Atomic voucher increment inside same transaction
      if (voucherId) {
        const voucher = await tx.voucher.findUnique({ where: { id: voucherId as string } })
        if (!voucher || !voucher.isActive) throw new Error("Voucher tidak valid")
        if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
          throw new Error("Voucher sudah habis")
        }
        await tx.voucher.update({
          where: { id: voucherId as string },
          data: { usedCount: { increment: 1 } },
        })
      }

      return tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          subtotal,
          tax: 0,
          total,
          discountAmount: discount,
          refCode,
          ...(voucherId ? { voucherId: voucherId as string } : {}),
          status: "PENDING",
          items: { create: orderItems },
        },
        include: { items: true },
      })
    })

    sendTelegramNotification(
      `🛒 <b>Pesanan Baru!</b>\n` +
      `Order: <code>${order.orderNumber}</code>\n` +
      `Pembeli: ${customerName} (${customerEmail})\n` +
      `Total: Rp ${total.toLocaleString("id-ID")}`
    )

    // Enhancement 1: Cache idempotency key
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        createdAt: Date.now(),
      })
    }

    return NextResponse.json({
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 })
  }
}
