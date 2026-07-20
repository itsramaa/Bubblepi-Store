/**
 * Manual Order Input API
 * For admin to create orders directly (e.g., from WhatsApp orders)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authError = await requireAdmin(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const {
      customerName,
      customerEmail,
      productId,
      variantId,
      warrantyDays = 0,
      price,
      paymentMethod = "MANUAL",
      notes,
      credentials,
    } = body

    // Validate required fields
    if (!customerName || !customerEmail || !productId || !variantId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `BP-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        guestName: customerName,
        guestEmail: customerEmail,
        status: "DELIVERED", // Direct deliver for manual orders
        paymentMethod: paymentMethod as any,
        paymentStatus: "PAID", // Assume paid for manual orders
        subtotal: price,
        total: price,
        paidAt: new Date(),
        deliveredAt: new Date(),
        items: {
          create: {
            variantId,
            quantity: 1,
            price,
          },
        },
      },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    })

    // If credentials provided, create stock record
    if (credentials) {
      await db.accountStock.create({
        data: {
          variantId,
          credentials,
          status: "SOLD",
          orderId: order.id,
          soldAt: new Date(),
        },
      })
    }

    // Create warranty if requested
    if (warrantyDays > 0) {
      const warrantyExpiry = new Date()
      warrantyExpiry.setDate(warrantyExpiry.getDate() + warrantyDays)

      // Use a placeholder userId for manual orders (could be admin or system)
      await db.warranty.create({
        data: {
          orderId: order.id,
          userId: order.userId || "system",
          productId,
          variantId,
          warrantyOptionId: warrantyDays.toString(),
          duration: warrantyDays,
          startDate: new Date(),
          expiryDate: warrantyExpiry,
          status: "ACTIVE",
        },
      })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    })
  } catch (error) {
    console.error("[ManualOrder]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}