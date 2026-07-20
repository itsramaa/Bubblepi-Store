import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { checkoutSchema, productSchema, variantSchema, stockItemSchema } from "../lib/validators"

describe("checkoutSchema", () => {
  it("accepts valid data", () => {
    const result = checkoutSchema.safeParse({
      guestName: "Budi Santoso",
      guestEmail: "budi@example.com",
      paymentMethod: "QRIS",
    })
    assert.equal(result.success, true)
  })

  it("rejects name shorter than 2 chars", () => {
    const result = checkoutSchema.safeParse({
      guestName: "A",
      guestEmail: "budi@example.com",
      paymentMethod: "QRIS",
    })
    assert.equal(result.success, false)
  })

  it("rejects invalid email", () => {
    const result = checkoutSchema.safeParse({
      guestName: "Budi",
      guestEmail: "not-an-email",
      paymentMethod: "QRIS",
    })
    assert.equal(result.success, false)
  })

  it("rejects invalid paymentMethod", () => {
    const result = checkoutSchema.safeParse({
      guestName: "Budi",
      guestEmail: "budi@example.com",
      paymentMethod: "BITCOIN",
    })
    assert.equal(result.success, false)
  })

  it("accepts VA with optional bankCode", () => {
    const result = checkoutSchema.safeParse({
      guestName: "Budi",
      guestEmail: "budi@example.com",
      paymentMethod: "VA",
      bankCode: "BCA",
    })
    assert.equal(result.success, true)
  })
})

describe("productSchema", () => {
  it("accepts valid product", () => {
    const result = productSchema.safeParse({
      name: "Netflix",
      slug: "netflix-premium",
      description: "Akun Netflix premium sharing",
      image: "https://cdn.example.com/netflix.png",
      category: "streaming",
      type: "sharing",
      isActive: true,
    })
    assert.equal(result.success, true)
  })

  it("rejects slug with uppercase", () => {
    const result = productSchema.safeParse({
      name: "Netflix",
      slug: "Netflix-Premium",
      description: "desc",
      image: "https://img.com/a.png",
      category: "streaming",
      type: "sharing",
      isActive: true,
    })
    assert.equal(result.success, false)
  })

  it("rejects invalid type", () => {
    const result = productSchema.safeParse({
      name: "Netflix",
      slug: "netflix",
      description: "desc",
      image: "https://img.com/a.png",
      category: "streaming",
      type: "unknown",
      isActive: true,
    })
    assert.equal(result.success, false)
  })
})

describe("variantSchema", () => {
  it("rejects non-positive price", () => {
    const result = variantSchema.safeParse({
      productId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      name: "1 Bulan",
      duration: "30 hari",
      price: 0,
      hasWarranty: false,
    })
    assert.equal(result.success, false)
  })

  it("accepts valid variant", () => {
    const result = variantSchema.safeParse({
      productId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      name: "1 Bulan",
      duration: "30 hari",
      price: 50000,
      hasWarranty: true,
      warrantyDays: 7,
    })
    assert.equal(result.success, true)
  })
})

describe("stockItemSchema", () => {
  it("rejects empty credentials", () => {
    const result = stockItemSchema.safeParse({
      variantId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      credentials: "",
    })
    assert.equal(result.success, false)
  })

  it("accepts valid stock item", () => {
    const result = stockItemSchema.safeParse({
      variantId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      credentials: "user@example.com:password123",
    })
    assert.equal(result.success, true)
  })
})
