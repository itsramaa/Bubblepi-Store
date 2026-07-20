/**
 * Testimonial System - Database & API
 */

import { db } from "@/lib/db"
import type { Testimonial } from "@prisma/client"

interface CreateTestimonialData {
  userId: string
  productId: string
  rating: number // 1-5
  comment: string
}

/**
 * Create a new testimonial
 */
export async function createTestimonial(data: CreateTestimonialData) {
  const { userId, productId, rating, comment } = data

  // Verify user exists
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  // Verify product exists
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error("Product not found")

  return db.testimonial.create({
    data: {
      userId,
      productId,
      rating,
      comment,
      isVisible: false, // Require admin approval first
      isPinned: false,
    },
  })
}

/**
 * Get visible testimonials (public)
 */
export async function getVisibleTestimonials(productId?: string, limit = 10) {
  return db.testimonial.findMany({
    where: {
      isVisible: true,
      ...(productId && { productId }),
    },
    include: { user: { select: { name: true } }, product: { select: { name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  })
}

/**
 * Get all testimonials (admin)
 */
export async function getAllTestimonials(page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const [testimonials, total] = await Promise.all([
    db.testimonial.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true } } },
    }),
    db.testimonial.count(),
  ])

  return { testimonials, total, page, totalPages: Math.ceil(total / limit) }
}

/**
 * Approve/reject testimonial (admin)
 */
export async function moderateTestimonial(id: string, isVisible: boolean) {
  return db.testimonial.update({
    where: { id },
    data: { isVisible },
  })
}

/**
 * Toggle pinned status (admin)
 */
export async function togglePinTestimonial(id: string, isPinned: boolean) {
  return db.testimonial.update({
    where: { id },
    data: { isPinned },
  })
}

/**
 * Get average rating for a product
 */
export async function getProductRating(productId: string) {
  const result = await db.testimonial.aggregate({
    where: { productId, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  })

  return {
    average: result._avg.rating || 0,
    count: result._count.rating || 0,
  }
}