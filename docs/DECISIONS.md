# Architectural Decision Records — Bubblepi Store

## ADR-001: In-Memory Rate Limiting

**Status:** Accepted (current scale)

**Context:** Sensitive API endpoints need abuse protection. Redis is the standard production solution but adds infrastructure overhead and cost.

**Decision:** Implement in-memory token bucket rate limiter using a plain Map with sliding windows. No external dependencies.

**Consequences:**
- Rate limit state resets on cold start (serverless function spin-down)
- Not shared across instances — each serverless function has its own counter
- Acceptable at current scale (< 100 concurrent users)

**Upgrade Path:** Replace lib/rate-limit.ts with Redis-based limiter (upstash-redis or ioredis) when moving to multi-region or hitting scale limits.

## ADR-002: AES-256-GCM for Credential Encryption

**Status:** Accepted

**Context:** AccountStock.credentials stored as plaintext in the database. Must be encrypted at rest.

**Decision:** Use AES-256-GCM (authenticated encryption) via Node.js built-in crypto module. Key stored as 32-byte hex string in ENCRYPTION_KEY env var. Encrypted format: `iv:authTag:ciphertext` (hex-encoded, colon-delimited).

**Consequences:**
- Symmetric encryption — same key encrypts and decrypts
- Decryption only performed at order fulfillment (credential reveal)
- Key rotation requires re-encrypting all credentials
- Auth tag prevents tampering (integrity verification)

**Upgrade Path:** Add key rotation support via versioned keys (prefix with key ID) when compliance requirements demand it.

## ADR-003: No Test Framework Added

**Status:** Accepted

**Context:** Unit tests needed for crypto module. package.json has no test framework.

**Decision:** Use Node.js built-in test runner (node:test + assert) instead of adding vitest/jest as a devDependency.

**Consequences:**
- Zero additional dependencies
- Limited to Node.js 18+ (modern LTS, fine for Next.js 16)
- No watch mode, no code coverage (accept for now)

**Upgrade Path:** Add vitest when writing React component tests (jsdom/environment setup needed anyway).

## ADR-004: Prisma $transaction for Stock Deduction

**Status:** Already implemented, documented here

**Context:** Stock assignment must be atomic to prevent overselling.

**Decision:** Use Prisma $transaction with row-level locking (SELECT ... FOR UPDATE pattern) in fulfillOrder().

**Consequences:**
- Two concurrent orders for the last item: one succeeds, one fails
- Transaction retries handled by Prisma client
- Consistent even under concurrent load

## ADR-005: Xendit Invoice API (Not Payment Request v2)

**Status:** Current limitation, documented

**Context:** Current integration uses Xendit Invoice API for payment processing.

**Decision:** Use Invoice API with 24h expiry. Webhook verifies via x-callback-token.

**Consequences:**
- Invoice-based flow (redirect to Xendit checkout page)
- 24h default expiry
- No direct PCI compliance needed (Xendit handles card data)
- Callback token provides webhook verification

**Upgrade Path:** Migrate to Xendit Payment Request v2 for embedded checkout experience when UX requirements demand it.

## Cross-Cutting: Vercel Serverless Considerations

- DATABASE_URL uses pgbouncer=true&connection_limit=1 to prevent Neon pool exhaustion
- Build command: `prisma generate && next build` (postinstall handles generate, but explicit is safer)
- Cron jobs via Vercel Cron Jobs (vercel.json configuration)
