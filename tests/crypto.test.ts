/**
 * Crypto utility tests
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert"

// Mock crypto for testing
const testKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

describe("Crypto Utils", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey
  })

  it("should encrypt and decrypt text", async () => {
    const { encrypt, decrypt } = await import("../lib/crypto")
    
    const original = "test-credential-123"
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    
    assert.strictEqual(decrypted, original)
  })

  it("should produce different ciphertext for same input", async () => {
    const { encrypt } = await import("../lib/crypto")
    
    const text = "same-text"
    const encrypted1 = encrypt(text)
    const encrypted2 = encrypt(text)
    
    assert.notStrictEqual(encrypted1, encrypted2)
  })

  it("should handle empty string", async () => {
    const { encrypt, decrypt } = await import("../lib/crypto")
    
    const encrypted = encrypt("")
    const decrypted = decrypt(encrypted)
    
    assert.strictEqual(decrypted, "")
  })
})

describe("Validators", () => {
  it("should validate email format", async () => {
    const { validateEmail } = await import("../lib/validators")
    
    assert.strictEqual(validateEmail("test@example.com"), true)
    assert.strictEqual(validateEmail("invalid"), false)
    assert.strictEqual(validateEmail(""), false)
  })

  it("should validate phone format", async () => {
    const { validatePhone } = await import("../lib/validators")
    
    assert.strictEqual(validatePhone("+62812345678"), true)
    assert.strictEqual(validatePhone("0812345678"), true)
    assert.strictEqual(validatePhone("123"), false)
  })
})