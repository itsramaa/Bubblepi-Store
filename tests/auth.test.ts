import { describe, it, before } from "node:test"
import assert from "node:assert/strict"

process.env.ADMIN_SECRET = "a".repeat(32)

let signAdminToken: () => Promise<string>
let verifyAdminToken: (token: string) => Promise<boolean>
let getAdminTokenFromHeaders: (headers: Headers) => string | null

before(async () => {
  const mod = await import("../lib/auth")
  signAdminToken = mod.signAdminToken
  verifyAdminToken = mod.verifyAdminToken
  getAdminTokenFromHeaders = mod.getAdminTokenFromHeaders
})

describe("signAdminToken", () => {
  it("returns a non-empty JWT string", async () => {
    const token = await signAdminToken()
    assert.ok(typeof token === "string" && token.length > 0)
  })

  it("token has 3 JWT parts (header.payload.signature)", async () => {
    const token = await signAdminToken()
    assert.equal(token.split(".").length, 3)
  })
})

describe("verifyAdminToken", () => {
  it("verifies a freshly signed token as true", async () => {
    const token = await signAdminToken()
    const valid = await verifyAdminToken(token)
    assert.equal(valid, true)
  })

  it("rejects an invalid token", async () => {
    const valid = await verifyAdminToken("not.a.valid.token")
    assert.equal(valid, false)
  })

  it("rejects empty string", async () => {
    const valid = await verifyAdminToken("")
    assert.equal(valid, false)
  })

  it("rejects tampered token", async () => {
    const token = await signAdminToken()
    const tampered = token.slice(0, -5) + "XXXXX"
    const valid = await verifyAdminToken(tampered)
    assert.equal(valid, false)
  })
})

describe("getAdminTokenFromHeaders", () => {
  it("extracts token from cookie header", () => {
    const headers = new Headers({ cookie: "admin-token=abc123; other=xyz" })
    const token = getAdminTokenFromHeaders(headers)
    assert.equal(token, "abc123")
  })

  it("returns null when no cookie header", () => {
    const headers = new Headers()
    const token = getAdminTokenFromHeaders(headers)
    assert.equal(token, null)
  })

  it("returns null when admin-token not in cookies", () => {
    const headers = new Headers({ cookie: "other=xyz; session=abc" })
    const token = getAdminTokenFromHeaders(headers)
    assert.equal(token, null)
  })
})
