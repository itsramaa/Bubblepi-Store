import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateOrderId, formatPrice } from "../lib/utils"

describe("generateOrderId", () => {
  it("returns string starting with BP-", () => {
    const id = generateOrderId()
    assert.ok(id.startsWith("BP-"))
  })

  it("has total length of 11 (BP- + 8 chars)", () => {
    const id = generateOrderId()
    assert.equal(id.length, 11)
  })

  it("suffix is uppercase alphanumeric only", () => {
    const id = generateOrderId()
    const suffix = id.slice(3)
    assert.match(suffix, /^[A-Z0-9]{8}$/)
  })

  it("generates unique IDs on consecutive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId()))
    assert.ok(ids.size > 95, `Expected > 95 unique IDs out of 100, got ${ids.size}`)
  })
})

describe("formatPrice", () => {
  it("formats 50000 as Rp 50.000", () => {
    const result = formatPrice(50000)
    assert.ok(result.includes("50.000"), `Got: ${result}`)
  })

  it("formats 0 as Rp 0", () => {
    const result = formatPrice(0)
    assert.ok(result.includes("0"))
  })

  it("formats 1000000 with correct thousand separator", () => {
    const result = formatPrice(1000000)
    assert.ok(result.includes("1.000.000"), `Got: ${result}`)
  })

  it("includes IDR currency marker", () => {
    const result = formatPrice(75000)
    assert.ok(result.includes("Rp") || result.includes("IDR"), `Got: ${result}`)
  })
})
