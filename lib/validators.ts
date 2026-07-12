import { z } from "zod"

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nama harus minimal 2 karakter"),
  customerEmail: z.string().email("Email tidak valid"),
  paymentMethod: z.enum(["QRIS", "VA"]),
  bankCode: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  image: z.string().min(1, "URL gambar tidak boleh kosong"),
  category: z.string().min(1),
  type: z.enum(["sharing", "private"]).default("sharing"),
  isActive: z.boolean(),
})

export const variantSchema = z.object({
  productId: z.string().cuid(),
  name: z.string().min(1),
  duration: z.string().min(1),
  price: z.number().int().positive(),
  hasWarranty: z.boolean().default(false),
  warrantyDays: z.number().int().positive().nullable().optional(),
})

export const stockItemSchema = z.object({
  variantId: z.string().cuid(),
  credentials: z.string().min(1, "Credentials tidak boleh kosong"),
})
