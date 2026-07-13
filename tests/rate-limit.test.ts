import { test } from "node:test"
import assert from "node:assert/strict"
import { checkRateLimit } from "../lib/rate-limit.js"

test("allows requests within limit", () => {
  const key = `test-${Date.now()}`
  for (let i = 0; i < 5; i++) {
    const result = checkRateLimit(key, 5, 60_000)
    assert.equal(result.allowed, true)
  }
})

test("blocks requests over limit", () => {
  const key = `test-${Date.now()}`
  for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000)
  const result = checkRateLimit(key, 5, 60_000)
  assert.equal(result.allowed, false)
  assert.ok(result.retryAfter > 0)
})

test("different keys are independent", () => {
  const key1 = `test-a-${Date.now()}`
  const key2 = `test-b-${Date.now()}`
  for (let i = 0; i < 5; i++) checkRateLimit(key1, 5, 60_000)
  const result = checkRateLimit(key2, 5, 60_000)
  assert.equal(result.allowed, true)
})
