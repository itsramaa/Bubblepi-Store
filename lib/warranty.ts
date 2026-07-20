/**
 * Warranty System Logic
 * Handles warranty claims, proof validation, and expiry checking
 */

import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

const PROOF_EXPIRY_HOURS = 24 // 1x24 jam after delivery

export interface CreateWarrantyClaimParams {
  orderId: string
  claimReason: string
  proofImageUrl: string
}

/**
 * Create a warranty claim
 */
export async function createWarrantyClaim(
  params: CreateWarrantyClaimParams
): Promise<{ success: boolean; claimId?: string; error?: string }> {
  const { orderId, claimReason, proofImageUrl } = params

  // Get order with warranty
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { warranty: true, items: { include: { variant: true } } },
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  if (!order.warranty) {
    return { success: false, error: "Order has no warranty" }
  }

  if (order.warranty.status !== "ACTIVE") {
    return { success: false, error: "Warranty is not active" }
  }

  // Check if warranty has expired
  if (!order.warranty.expiryDate || new Date() > new Date(order.warranty.expiryDate)) {
    return { success: false, error: "Warranty has expired" }
  }

  // Check if there's already a pending claim
  const existingClaim = await db.warrantyClaim.findFirst({
    where: {
      warrantyId: order.warranty.id,
      status: { in: ["PENDING_REVIEW"] },
    },
  })

  if (existingClaim) {
    return { success: false, error: "There is already a pending claim" }
  }

  // Create the claim
  const claim = await db.warrantyClaim.create({
    data: {
      warrantyId: order.warranty.id,
      claimReason,
      proofImageUrl,
      proofImageExpiry: new Date(Date.now() + PROOF_EXPIRY_HOURS * 60 * 60 * 1000),
      status: "PENDING_REVIEW",
    },
  })

  // Notify admin
  await sendTelegramNotification(
    `🛡️ <b>Klaim Garansi Baru</b>\n` +
    `Order: <code>${order.orderNumber}</code>\n` +
    `Alasan: ${claimReason}\n` +
    `Batas bukti: ${PROOF_EXPIRY_HOURS} jam`
  )

  return { success: true, claimId: claim.id }
}

/**
 * Get warranty details for an order
 */
export async function getWarrantyByOrderId(orderId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      warranty: {
        include: {
          claims: {
            orderBy: { submittedAt: "desc" },
          },
        },
      },
      items: { include: { variant: true } },
    },
  }) as any
  
  if (!order?.warranty) return null

  const w = order.warranty
  return {
    ...w,
    isExpired: !w.expiryDate || new Date() > new Date(w.expiryDate),
    canClaim: 
      w.status === "ACTIVE" &&
      (!w.expiryDate || new Date() <= new Date(w.expiryDate)) &&
      !w.claims.some((c: any) => c.status === "PENDING_REVIEW"),
  }
}

/**
 * Check and update expired proof images
 * Called by cron job
 */
export async function processExpiredProofImages(): Promise<number> {
  const expiredClaims = await db.warrantyClaim.findMany({
    where: {
      status: "PENDING_REVIEW",
      proofImageExpiry: { lt: new Date() },
    },
    include: {
      warranty: {
        include: { order: true },
      },
    },
  })

  for (const claim of expiredClaims) {
    await db.warrantyClaim.update({
      where: { id: claim.id },
      data: { status: "EXPIRED" },
    })

    await sendTelegramNotification(
      `⚠️ <b>Bukti Klaim Expired</b>\n` +
      `Order: <code>${claim.warranty.order.orderNumber}</code>\n` +
      `Klaim expired karena bukti lebih dari ${PROOF_EXPIRY_HOURS} jam`
    )
  }

  return expiredClaims.length
}

/**
 * Check and auto-expire warranties past their expiry date
 * Called by cron job
 */
export async function processExpiredWarranties(): Promise<number> {
  const expiredWarranties = await db.warranty.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: { lt: new Date() },
    },
    include: { order: true },
  })

  for (const warranty of expiredWarranties) {
    await db.warranty.update({
      where: { id: warranty.id },
      data: { status: "EXPIRED" },
    })

    // Reject any pending claims
    await db.warrantyClaim.updateMany({
      where: { warrantyId: warranty.id, status: "PENDING_REVIEW" },
      data: { status: "REJECTED", rejectionReason: "Warranty period expired" },
    })
  }

  return expiredWarranties.length
}