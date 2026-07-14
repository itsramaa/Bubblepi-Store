import { describe, it } from "node:test"
import assert from "node:assert/strict"

describe("Order discount calculation", () => {
  function calcTotal(subtotal: number, discount: number): number {
    return Math.max(subtotal - discount, 0)
  }

  it("total = subtotal - discount", () => {
    assert.equal(calcTotal(100000, 10000), 90000)
  })

  it("total is never negative", () => {
    assert.equal(calcTotal(10000, 50000), 0)
  })

  it("total = subtotal when no discount", () => {
    assert.equal(calcTotal(75000, 0), 75000)
  })
})

describe("Voucher discount calculation", () => {
  function calcVoucherDiscount(
    cartTotal: number,
    type: "PERCENT" | "FIXED",
    value: number
  ): number {
    return type === "PERCENT"
      ? Math.round(cartTotal * value / 100)
      : value
  }

  it("PERCENT 10% of 100000 = 10000", () => {
    assert.equal(calcVoucherDiscount(100000, "PERCENT", 10), 10000)
  })

  it("PERCENT 50% of 50000 = 25000", () => {
    assert.equal(calcVoucherDiscount(50000, "PERCENT", 50), 25000)
  })

  it("FIXED 15000 always returns 15000", () => {
    assert.equal(calcVoucherDiscount(100000, "FIXED", 15000), 15000)
  })

  it("PERCENT rounds correctly (no float artifacts)", () => {
    // 33% of 100001 = 33000.33 → rounds to 33000
    const result = calcVoucherDiscount(100001, "PERCENT", 33)
    assert.equal(result, 33000)
  })
})

describe("Referral refCode encoding", () => {
  it("base64url encode/decode round-trip for email", () => {
    const email = "user@example.com"
    const encoded = Buffer.from(email).toString("base64url")
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8")
    assert.equal(decoded, email)
  })

  it("different emails produce different codes", () => {
    const a = Buffer.from("a@example.com").toString("base64url")
    const b = Buffer.from("b@example.com").toString("base64url")
    assert.notEqual(a, b)
  })
})
