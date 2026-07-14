import { describe, it, before } from "node:test"
import assert from "node:assert/strict"

process.env.ENCRYPTION_KEY = "a".repeat(64)

let isEncrypted: (value: string) => boolean
let encrypt: (plaintext: string) => string

before(async () => {
  const mod = await import("../lib/crypto")
  isEncrypted = mod.isEncrypted
  encrypt = mod.encrypt
})

describe("isEncrypted – hex validation (post-fix)", () => {
  it("returns false for 3-part credential with non-hex first segment", () => {
    assert.equal(isEncrypted("user@email.com:password:extra"), false)
  })

  it("returns false for 3-part string where iv is 24 chars but not hex", () => {
    const notHexIv = "z".repeat(24)
    const validTag = "a".repeat(32)
    const ct = "b".repeat(16)
    assert.equal(isEncrypted(`${notHexIv}:${validTag}:${ct}`), false)
  })

  it("returns false for 3-part string where tag is 32 chars but not hex", () => {
    const validIv = "a".repeat(24)
    const notHexTag = "z".repeat(32)
    const ct = "b".repeat(16)
    assert.equal(isEncrypted(`${validIv}:${notHexTag}:${ct}`), false)
  })

  it("returns true for actual encrypt() output", () => {
    const result = encrypt("test-credential")
    assert.equal(isEncrypted(result), true)
  })
})
