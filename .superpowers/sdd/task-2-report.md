# Task 2 Report — AES-256-GCM Credential Encryption

**Date:** 2026-07-13  
**Branch:** feat/prod-hardening  
**Commit:** 702b46c  
**Status:** DONE

---

## What was implemented

1. **`lib/crypto.ts`** — AES-256-GCM encrypt/decrypt/isEncrypted using Node.js built-in `crypto`. IV is 12 bytes (96-bit), auth tag 16 bytes. Output format: `iv:authTag:ciphertext` (hex-colon-separated).

2. **`scripts/encrypt-credentials.ts`** — One-time migration script to encrypt existing plaintext credentials in DB in batches of 100 with cursor-based pagination, skipping already-encrypted values.

3. **`lib/order.ts`** — Added `decrypt`/`isEncrypted` import; credentials are decrypted before delivery with backward-compat guard.

4. **`app/api/admin/stock/bulk-upload/route.ts`** — Added `encrypt` import; all credentials encrypted before DB insert.

5. **`app/api/admin/stock/[id]/route.ts`** — Added GET handler (decrypts credentials before returning); PATCH now encrypts plaintext credentials before saving.

6. **`.env.example`** — Uncommented `ENCRYPTION_KEY` with placeholder and generation instructions.

7. **`tests/crypto.test.ts`** — 4 unit tests using `node:test` + `npx tsx`.

---

## Test Results

```
▶ AES-256-GCM encryption
  ✔ encrypt/decrypt round-trip (2.34ms)
  ✔ isEncrypted detects encrypted values (0.29ms)
  ✔ different encryptions of same plaintext produce different ciphertexts (random IV) (0.43ms)
  ✔ decrypt throws on tampered ciphertext (0.57ms)
✔ AES-256-GCM encryption (4.94ms)
tests 4 | pass 4 | fail 0
```

## Build Result

`npx next build` — ✓ Compiled successfully (Turbopack, 14.2s), TypeScript clean, 36 static pages generated, 0 errors.

## Concerns

None. The `ReferenceError: location is not defined` warning during static page generation is a pre-existing issue unrelated to this task (present before Task 2 changes).
