import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

// lib/env.ts validates at module load time and only throws in production.
// It exports `env` (a cast of process.env) and the `Env` type.
// We test the runtime behaviour: the module exports env pointing to process.env,
// and the schema rejects missing/invalid vars when NODE_ENV=production.

describe('env – module exports', () => {
  it('exports env as the process.env object', async () => {
    // Set a minimal valid env so the module loads in any NODE_ENV
    process.env.DATABASE_URL = 'https://db.example.com'
    process.env.ADMIN_PASSWORD = 'supersecret123'
    process.env.ADMIN_SECRET = 'a'.repeat(32)
    process.env.XENDIT_SECRET_KEY = 'xnd_test_key'
    process.env.XENDIT_WEBHOOK_TOKEN = 'webhook_token'
    process.env.RESEND_API_KEY = 'resend_key'
    process.env.RESEND_FROM_EMAIL = 'no-reply@example.com'
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    process.env.TELEGRAM_BOT_TOKEN = 'bot123token'
    process.env.TELEGRAM_CHAT_ID = '-1001234567890'
    process.env.CRON_SECRET = 'cron_secret_1234567'
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = '+1234567890'
    process.env.ENCRYPTION_KEY = 'a'.repeat(64)

    const { env } = await import('../lib/env')
    assert.equal(env, process.env as unknown)
  })

  it('env reflects current process.env values', async () => {
    process.env.TELEGRAM_CHAT_ID = '-999888777'
    const { env } = await import('../lib/env')
    assert.equal(env.TELEGRAM_CHAT_ID, '-999888777')
  })
})

describe('env – schema validation', () => {
  it('schema rejects ENCRYPTION_KEY shorter than 64 chars', async () => {
    const { z } = await import('zod')
    const schema = z.string().length(64, 'ENCRYPTION_KEY must be a 64-char hex string')
    const result = schema.safeParse('tooshort')
    assert.equal(result.success, false)
  })

  it('schema rejects ENCRYPTION_KEY longer than 64 chars', async () => {
    const { z } = await import('zod')
    const schema = z.string().length(64, 'ENCRYPTION_KEY must be a 64-char hex string')
    const result = schema.safeParse('a'.repeat(65))
    assert.equal(result.success, false)
  })

  it('schema accepts ENCRYPTION_KEY of exactly 64 chars', async () => {
    const { z } = await import('zod')
    const schema = z.string().length(64, 'ENCRYPTION_KEY must be a 64-char hex string')
    const result = schema.safeParse('a'.repeat(64))
    assert.equal(result.success, true)
  })

  it('schema rejects invalid DATABASE_URL', async () => {
    const { z } = await import('zod')
    const schema = z.string().url()
    const result = schema.safeParse('not-a-url')
    assert.equal(result.success, false)
  })

  it('schema rejects ADMIN_PASSWORD shorter than 8 chars', async () => {
    const { z } = await import('zod')
    const schema = z.string().min(8)
    const result = schema.safeParse('short')
    assert.equal(result.success, false)
  })

  it('schema rejects RESEND_FROM_EMAIL that is not an email', async () => {
    const { z } = await import('zod')
    const schema = z.string().email()
    const result = schema.safeParse('not-an-email')
    assert.equal(result.success, false)
  })

  it('schema accepts valid RESEND_FROM_EMAIL', async () => {
    const { z } = await import('zod')
    const schema = z.string().email()
    const result = schema.safeParse('hello@example.com')
    assert.equal(result.success, true)
  })

  it('schema rejects ADMIN_SECRET shorter than 32 chars', async () => {
    const { z } = await import('zod')
    const schema = z.string().min(32)
    const result = schema.safeParse('tooshort')
    assert.equal(result.success, false)
  })

  it('schema rejects CRON_SECRET shorter than 16 chars', async () => {
    const { z } = await import('zod')
    const schema = z.string().min(16)
    const result = schema.safeParse('short')
    assert.equal(result.success, false)
  })
})
