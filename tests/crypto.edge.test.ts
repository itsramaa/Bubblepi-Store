import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

// Must set ENCRYPTION_KEY before importing crypto module
process.env.ENCRYPTION_KEY = 'a'.repeat(64)

import { encrypt, decrypt, isEncrypted } from '../lib/crypto'

describe('encrypt – error cases', () => {
  it('throws when ENCRYPTION_KEY is missing', () => {
    const saved = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    assert.throws(
      () => encrypt('test'),
      /ENCRYPTION_KEY must be a 64-char hex string/
    )
    process.env.ENCRYPTION_KEY = saved
  })

  it('throws when ENCRYPTION_KEY is too short', () => {
    const saved = process.env.ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = 'a'.repeat(32)
    assert.throws(
      () => encrypt('test'),
      /ENCRYPTION_KEY must be a 64-char hex string/
    )
    process.env.ENCRYPTION_KEY = saved
  })

  it('throws when ENCRYPTION_KEY is too long', () => {
    const saved = process.env.ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = 'a'.repeat(128)
    assert.throws(
      () => encrypt('test'),
      /ENCRYPTION_KEY must be a 64-char hex string/
    )
    process.env.ENCRYPTION_KEY = saved
  })
})

describe('decrypt – error cases', () => {
  it('throws on empty string', () => {
    assert.throws(
      () => decrypt(''),
      /Invalid ciphertext format/
    )
  })

  it('throws on missing colons (single segment)', () => {
    assert.throws(
      () => decrypt('nodcolonsatall'),
      /Invalid ciphertext format/
    )
  })

  it('throws on only two parts (missing third segment)', () => {
    assert.throws(
      () => decrypt('part1:part2'),
      /Invalid ciphertext format/
    )
  })

  it('throws on four or more parts', () => {
    assert.throws(
      () => decrypt('a:b:c:d'),
      /Invalid ciphertext format/
    )
  })

  it('throws on three parts with invalid hex / bad auth tag', () => {
    // Structurally 3 parts but not a real ciphertext — should throw during decryption
    assert.throws(() => decrypt('aabbcc:ddeeff:112233'))
  })
})

describe('isEncrypted', () => {
  it('returns false for plain email:pass (2-part string)', () => {
    assert.equal(isEncrypted('user@example.com:mypassword'), false)
  })

  it('returns false for a 2-part string', () => {
    assert.equal(isEncrypted('foo:bar'), false)
  })

  it('returns false for a plain string with no colons', () => {
    assert.equal(isEncrypted('plaintextvalue'), false)
  })

  it('returns false when first part is not 24 chars', () => {
    // parts.length === 3 but iv hex is wrong length
    const shortIv = 'ab'.repeat(4) // 8 chars, not 24
    const tag = 'cd'.repeat(16)    // 32 chars
    const ct = 'ef'.repeat(8)
    assert.equal(isEncrypted(`${shortIv}:${tag}:${ct}`), false)
  })

  it('returns false when second part is not 32 chars', () => {
    const iv = 'ab'.repeat(12)     // 24 chars
    const shortTag = 'cd'.repeat(4) // 8 chars, not 32
    const ct = 'ef'.repeat(8)
    assert.equal(isEncrypted(`${iv}:${shortTag}:${ct}`), false)
  })

  it('returns true for a correctly structured iv:tag:ciphertext string', () => {
    const iv = 'a'.repeat(24)
    const tag = 'b'.repeat(32)
    const ct = 'c'.repeat(16)
    assert.equal(isEncrypted(`${iv}:${tag}:${ct}`), true)
  })

  it('returns true for actual encrypted output', () => {
    const encrypted = encrypt('hello world')
    assert.equal(isEncrypted(encrypted), true)
  })
})

describe('encrypt/decrypt – round-trip', () => {
  it('round-trip preserves ASCII plaintext', () => {
    const plaintext = 'hello:world'
    assert.equal(decrypt(encrypt(plaintext)), plaintext)
  })

  it('round-trip preserves unicode characters', () => {
    const plaintext = 'こんにちは:パスワード123'
    assert.equal(decrypt(encrypt(plaintext)), plaintext)
  })

  it('round-trip preserves emoji', () => {
    const plaintext = '🔐secret🔑'
    assert.equal(decrypt(encrypt(plaintext)), plaintext)
  })

  it('round-trip preserves empty string', () => {
    assert.equal(decrypt(encrypt('')), '')
  })

  it('each encrypt call produces a different ciphertext (random IV)', () => {
    const plaintext = 'same input'
    const c1 = encrypt(plaintext)
    const c2 = encrypt(plaintext)
    assert.notEqual(c1, c2)
  })
})
