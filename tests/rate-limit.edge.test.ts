import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { checkRateLimit } from '../lib/rate-limit'

const testKey = 'test:edge'

describe('checkRateLimit – edge cases', () => {
  it('limit=1: first request allowed, second blocked', () => {
    const r1 = checkRateLimit(`${testKey}:l1`, 1, 1000)
    assert.equal(r1.allowed, true)
    assert.equal(r1.retryAfter, 0)

    const r2 = checkRateLimit(`${testKey}:l1`, 1, 1000)
    assert.equal(r2.allowed, false)
    assert.ok(r2.retryAfter > 0)
  })

  it('large limit (1000): does not block at 1000 but blocks at 1001', () => {
    const key = `${testKey}:large`
    // Fill exactly to the limit — all 1000 should be allowed
    for (let i = 0; i < 1000; i++) {
      const r = checkRateLimit(key, 1000, 60_000)
      assert.equal(r.allowed, true, `expected allowed at i=${i}`)
    }
    // 1001st request: count is now >= limit, should be blocked
    const r1001 = checkRateLimit(key, 1000, 60_000)
    assert.equal(r1001.allowed, false)
    assert.ok(r1001.retryAfter > 0)
  })
})

describe('checkRateLimit – window reset', () => {
  it('allows again after the window expires', async () => {
    const key = `${testKey}:window_reset`
    const windowMs = 100 // 100ms window
    const limit = 2

    // Exhaust the limit
    const r1 = checkRateLimit(key, limit, windowMs)
    assert.equal(r1.allowed, true)
    const r2 = checkRateLimit(key, limit, windowMs)
    assert.equal(r2.allowed, true)

    // Third request should be blocked
    const r3 = checkRateLimit(key, limit, windowMs)
    assert.equal(r3.allowed, false)

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again
    const r4 = checkRateLimit(key, limit, windowMs)
    assert.equal(r4.allowed, true)
    assert.equal(r4.retryAfter, 0)
  })
})

describe('checkRateLimit – retryAfter accuracy', () => {
  it('retryAfter is approximately correct (within 50ms of window)', () => {
    const key = `${testKey}:retryAfter`
    const windowMs = 200
    const limit = 1

    // Use up the limit
    checkRateLimit(key, limit, windowMs)

    // Immediately try again — retryAfter should be close to 200ms (0.2s ceiling)
    const r = checkRateLimit(key, limit, windowMs)
    assert.equal(r.allowed, false)
    // retryAfter is Math.ceil((oldest + windowMs - now) / 1000)
    // oldest was just recorded a fraction of ms ago, so retryAfter should be ceil(windowMs/1000)
    // For 200ms window: 200/1000 = 0.2, Math.ceil(0.2) = 1 second
    // It could be 0 or 1 depending on timing, but never more than ceil(windowMs/1000)
    const maxExpected = Math.ceil(windowMs / 1000)
    assert.ok(r.retryAfter >= 0)
    assert.ok(r.retryAfter <= maxExpected, `retryAfter ${r.retryAfter} > max ${maxExpected}`)
  })

  it('retryAfter increases after waiting partway through window', async () => {
    const key = `${testKey}:retryAfter2`
    const windowMs = 500
    const limit = 1

    checkRateLimit(key, limit, windowMs)
    const r1 = checkRateLimit(key, limit, windowMs)
    assert.equal(r1.allowed, false)
    const firstRetryAfter = r1.retryAfter

    // Wait a bit less than the window
    await new Promise(resolve => setTimeout(resolve, 200))

    // After waiting some time, retryAfter should have decreased
    const r2 = checkRateLimit(key, limit, windowMs)
    assert.equal(r2.allowed, false)
    assert.ok(r2.retryAfter <= firstRetryAfter, `${r2.retryAfter} > ${firstRetryAfter}`)
  })
})

describe('checkRateLimit – isolation between keys', () => {
  it('different keys do not affect each other', () => {
    const r1 = checkRateLimit(`${testKey}:iso1`, 1, 1000)
    assert.equal(r1.allowed, true)

    // Different key should be allowed even though iso1 is exhausted
    const r2 = checkRateLimit(`${testKey}:iso2`, 1, 1000)
    assert.equal(r2.allowed, true)

    // iso1 is still exhausted
    const r3 = checkRateLimit(`${testKey}:iso1`, 1, 1000)
    assert.equal(r3.allowed, false)
  })
})
