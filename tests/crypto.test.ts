import { describe, it, before } from "node:test"
import assert from "node:assert/strict"

// Set test key before importing crypto module
process.env.ENCRYPTION_KEY = "a".repeat(64) // 64 hex chars = 32 bytes

let encrypt: (plaintext: string) => string
let decrypt: (ciphertext: string) => string
let isEncrypted: (value: string) => boolean

before(async () => {
  const mod = await import("../lib/crypto.js")
  encrypt = mod.encrypt
  decrypt = mod.decrypt
  isEncrypted = mod.isEncrypted
})

describe("AES-256-GCM encryption", () => {
  it("encrypt/decrypt round-trip", () => {
    const plaintext = "netflix:user@example.com:password123"
    const ciphertext = encrypt(plaintext)
    assert.notEqual(ciphertext, plaintext)
    assert.equal(decrypt(ciphertext), plaintext)
  })

  it("isEncrypted detects encrypted values", () => {
    const plaintext = "user@example.com:password"
    const ciphertext = encrypt(plaintext)
    assert.equal(isEncrypted(ciphertext), true)
    assert.equal(isEncrypted(plaintext), false)
  })

  it("different encryptions of same plaintext produce different ciphertexts (random IV)", () => {
    const plaintext = "test-credential"
    const c1 = encrypt(plaintext)
    const c2 = encrypt(plaintext)
    assert.notEqual(c1, c2)
    assert.equal(decrypt(c1), plaintext)
    assert.equal(decrypt(c2), plaintext)
  })

  it("decrypt throws on tampered ciphertext", () => {
    const ciphertext = encrypt("secret")
    const tampered = ciphertext.replace(/.$/, "x")
    assert.throws(() => decrypt(tampered))
  })
})
