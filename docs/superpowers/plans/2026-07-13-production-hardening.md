# Bubblepi Store — Production Hardening & Feature Completion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Take Bubblepi Store from MVP to production-grade: secure, tested, feature-complete, revenue-ready.

**Architecture:** Next.js 16 App Router with Prisma 6 + Neon PostgreSQL. All sensitive operations server-side. In-memory rate limiting, AES-256-GCM credential encryption, idempotent webhook handling.

**Tech Stack:** Next.js 16.2.10, React 19, Prisma 6, Tailwind 4, shadcn/ui, xendit-node v7, resend v6, jose v6, zod v4, Node.js crypto (built-in)

## Global Constraints
- Repo: ~/projects/Bubblepi-Store — work here, never clone
- Package manager: pnpm only
- No new dependencies unless absolutely unavoidable — prefer stdlib/already-installed
- TypeScript strict: no `any`, no unchecked nulls
- All DB mutations in Prisma $transaction where atomicity matters
- Commit after each task with conventional commit format
- Test: Node built-in test runner (node:test) for unit tests — no new test framework
- pnpm build must pass with 0 errors after each task

---

## Task 1: Security & Stability Foundations

**Goal:** Close every admin route guard gap, add health endpoint, global error boundaries, and env validation so the app fails safe on first deployment.

### Files

| Action | File | Description |
|--------|------|-------------|
| Modify | app/api/admin/auth/route.ts | Already has requireAdmin() guard (login route is unauthenticated by design — only the POST handler needs guarding) |
| Modify | app/api/admin/orders/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/orders/[id]/route.ts | **CRITICAL FIX:** GET handler missing requireAdmin(); generic `data: { status: body.status }` PATCH path missing requireAdmin() and status validation |
| Modify | app/api/admin/orders/export/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/products/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/products/[id]/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/stock/bulk-upload/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/stock/[id]/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/vouchers/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/reviews/route.ts | Add requireAdmin() + try/catch if missing |
| Modify | app/api/admin/stats/route.ts | Add requireAdmin() + try/catch if missing |
| Create | app/api/health/route.ts | DB connectivity health check |
| Create | app/error.tsx | Global error boundary |
| Create | app/not-found.tsx | 404 boundary |
| Create | lib/env.ts | Zod-based env validation at startup |
| Create | .env.example | Complete env var template with comments |
| Modify | lib/db.ts | Add connection pooling comment + DATABASE_URL pooling hint (no code change — just .env.example docs) |

### Interfaces

- **Consumes:** Existing requireAdmin() in lib/admin-auth.ts, existing PrismaClient singleton in lib/db.ts
- **Produces:** GET /api/health → `{ status: "ok", timestamp, db: "connected"|"error" }`, validated env object, global error/404 boundaries

### Step-by-step

**Step 1: Audit admin routes**

Run the following to list all admin API routes:
```bash
find ~/projects/Bubblepi-Store/app/api/admin -name 'route.ts' | sort
```

Expected output lists all route files. For each file, inspect if it imports `requireAdmin` and calls it before handler logic.

**Step 2: Fix app/api/admin/orders/[id]/route.ts**

This is the most critical fix. The route likely has:

```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Missing requireAdmin()
  const order = await db.order.findUnique({ ... });
  return Response.json(order);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  // Some paths have requireAdmin(), the generic `data: { status: body.status }` path does NOT
  ...
}
```

Patch pattern:

```typescript
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const order = await db.order.findUnique({ ... });
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    return Response.json(order);
  } catch (error) {
    console.error('GET /api/admin/orders/[id] error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { status } = body;

    // Validate status is one of allowed transitions
    const VALID_STATUSES = ['PAID', 'FULFILLED', 'FAILED', 'CANCELLED'];
    if (status && !VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // ... rest of handler with try/catch
  } catch (error) {
    // ...
  }
}
```

**Step 3: Add try/catch to each admin route**

Apply a consistent error response pattern:

```typescript
try {
  await requireAdmin();
  // handler logic
} catch (error) {
  console.error(`[${method}] ${path} error:`, error);
  // Distinguish between auth errors and internal errors
  if (error instanceof Error && error.message === 'Unauthorized') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
```

**Step 4: Create app/api/health/route.ts**

```typescript
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return Response.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        db: 'disconnected',
      },
      { status: 503 }
    );
  }
}
```

**Step 5: Create app/error.tsx**

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="mt-2 text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
```

**Step 6: Create app/not-found.tsx**

```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="mt-2 text-muted-foreground">
        Could not find the requested page
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Return home
      </Link>
    </div>
  );
}
```

**Step 7: Create lib/env.ts**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_SECRET: z.string().min(32),
  XENDIT_SECRET_KEY: z.string().min(1),
  XENDIT_WEBHOOK_TOKEN: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_WHATSAPP: z.string().optional(),
  ENCRYPTION_KEY: z.string().length(64).optional(), // 32 bytes hex, optional for now
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // List missing/invalid vars in a clear error message
    const missing = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Environment validation failed:\n${missing}`
    );
  }
  return result.data;
}

export const env = envSchema.parse(process.env);
```

Import `validateEnv()` in `next.config.ts` or call on first request in a middleware.

**Step 8: Create .env.example**

```bash
# Bubblepi Store — Environment Variables
# Copy this file to .env and fill in values

# Database
DATABASE_URL="postgresql://user:pass@host:5432/bubblepi?pgbouncer=true&connection_limit=1"
# ^ For Vercel serverless: use pgbouncer=true + connection_limit=1 to avoid pool exhaustion

# Admin Authentication
ADMIN_PASSWORD="your-strong-admin-password-min-8-chars"
ADMIN_SECRET="your-jwt-secret-min-32-chars-random"

# Xendit Payment Gateway
XENDIT_SECRET_KEY="xnd_development_..."
XENDIT_WEBHOOK_TOKEN="your-xendit-webhook-verification-token"

# Resend (Email)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="https://bubblepi-store.vercel.app"

# Telegram Notifications (optional — leave blank to disable)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

# Cron Jobs
CRON_SECRET="your-cron-job-secret"

# Customer Support (optional)
NEXT_PUBLIC_SUPPORT_WHATSAPP=""

# Encryption (add in Task 2)
# ENCRYPTION_KEY="<32-byte-hex>"  # Generate with: openssl rand -hex 32
```

**Step 9: Update lib/db.ts**

Add a comment above the PrismaClient instantiation:

```typescript
// ponytail: connection pooling — DATABASE_URL should include ?pgbouncer=true&connection_limit=1
// for Vercel serverless. See .env.example for the recommended URL format.
```

**Step 10: Run build check**

```bash
cd ~/projects/Bubblepi-Store
pnpm build
```

Expected: 0 errors (TypeScript compilation + lint pass).

### Commit

```bash
git add -A
git commit -m "fix: security hardening — admin guards, health endpoint, env validation"
```

---

## Task 2: AES-256-GCM Credential Encryption

**Goal:** Encrypt AccountStock.credentials at rest using AES-256-GCM. Decrypt only on order fulfillment (credential reveal). Migrate existing plaintext data.

### Files

| Action | File | Description |
|--------|------|-------------|
| Create | lib/crypto.ts | encrypt() / decrypt() with AES-256-GCM + auth tag |
| Create | scripts/encrypt-credentials.ts | One-time migration script |
| Modify | lib/order.ts | Decrypt credentials before adding to deliveredItems |
| Modify | app/api/admin/stock/bulk-upload/route.ts | Encrypt before createMany |
| Modify | app/api/admin/stock/[id]/route.ts | Encrypt on create/update, decrypt on GET |
| Modify | .env.example | Add ENCRYPTION_KEY |
| Create | tests/crypto.test.ts | Round-trip unit tests |

### Interfaces

- **Consumes:** ENCRYPTION_KEY env var (32-byte hex string), AccountStock.credentials (string)
- **Produces:** Encrypted format = `${iv}:${authTag}:${ciphertext}` (all hex-encoded, colon-delimited)

### Step-by-step

**Step 1: Create lib/crypto.ts**

```typescript
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns colon-delimited hex: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt ciphertext produced by encrypt().
 * Accepts colon-delimited hex: iv:authTag:ciphertext
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format: expected iv:authTag:ciphertext');
  }
  const [ivHex, authTagHex, encrypted] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Step 2: Create scripts/encrypt-credentials.ts**

```typescript
import { db } from '../lib/db';
import { encrypt } from '../lib/crypto';

async function main() {
  console.log('Starting credential encryption migration...');

  const BATCH_SIZE = 100;
  let cursor: string | undefined;
  let total = 0;
  let encrypted = 0;
  let skipped = 0;

  while (true) {
    const batch = await db.accountStock.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (batch.length === 0) break;

    for (const record of batch) {
      // Skip already-encrypted (format: iv:authTag:ciphertext with 3 colon-separated hex parts)
      if (record.credentials.split(':').length === 3 && /^[0-9a-f]+$/.test(record.credentials.replace(/:/g, ''))) {
        skipped++;
        continue;
      }

      try {
        const encryptedCreds = encrypt(record.credentials);
        await db.accountStock.update({
          where: { id: record.id },
          data: { credentials: encryptedCreds },
        });
        encrypted++;
      } catch (err) {
        console.error(`Failed to encrypt record ${record.id}:`, err);
      }
    }

    total += batch.length;
    cursor = batch[batch.length - 1].id;
    console.log(`Processed ${total} records...`);
  }

  console.log(`Migration complete: ${encrypted} encrypted, ${skipped} skipped, ${total} total`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
```

Run with:
```bash
cd ~/projects/Bubblepi-Store && npx tsx scripts/encrypt-credentials.ts
```

**Step 3: Update lib/order.ts**

Find the line where `assigned.credentials` is used (around line 40 in the fulfillOrder function). Add decryption:

```typescript
// Before adding to deliveredItems, decrypt the credential
const decryptedCredential = decrypt(assigned.credentials);

deliveredItems.push({
  productName: assigned.variant.product.name,
  variantName: assigned.variant.name,
  credential: decryptedCredential,
});
```

Import: `import { decrypt } from '@/lib/crypto';`

**Step 4: Update app/api/admin/stock/bulk-upload/route.ts**

Before `db.accountStock.createMany()`, encrypt each credential:

```typescript
import { encrypt } from '@/lib/crypto';

// In the handler, after parsing the CSV/JSON input:
const records = parsedData.map((row: { credentials: string; variantId: string }) => ({
  variantId: row.variantId,
  credentials: encrypt(row.credentials.trim()),
}));

await db.accountStock.createMany({ data: records });
```

**Step 5: Update app/api/admin/stock/[id]/route.ts**

For POST/PUT (create/update): encrypt credentials before write.
For GET: decrypt credentials in the response.

```typescript
// In POST/PUT handler:
const encrypted = encrypt(body.credentials);
await db.accountStock.create({ data: { ...body, credentials: encrypted } });

// In GET handler:
const stocks = await db.accountStock.findMany({ ... });
const decrypted = stocks.map((s) => ({
  ...s,
  credentials: decrypt(s.credentials),
}));
```

**Step 6: Add ENCRYPTION_KEY to .env.example**

Append to .env.example:
```
# Encryption (AES-256-GCM for AccountStock credentials)
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY="<32-byte-hex-string>"
```

**Step 7: Write unit tests at tests/crypto.test.ts**

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encrypt, decrypt } from '../lib/crypto';

// Set a test key
process.env.ENCRYPTION_KEY = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

describe('AES-256-GCM encryption', () => {
  it('should encrypt and decrypt round-trip', () => {
    const plaintext = 'user:password123@server.com';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, plaintext);
  });

  it('should produce unique ciphertexts for same plaintext (different IV)', () => {
    const plaintext = 'same-text';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    assert.notStrictEqual(a, b);
  });

  it('should handle special characters', () => {
    const plaintext = '密码:パスワード:p@$$w0rd!\\n';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, plaintext);
  });

  it('should reject invalid encrypted format', () => {
    assert.throws(() => decrypt('invalid-format'), /Invalid encrypted format/);
    assert.throws(() => decrypt('too:many:parts:here'), /Invalid encrypted format/);
  });

  it('should reject tampered ciphertext', () => {
    const encrypted = encrypt('original');
    const tampered = encrypted.replace(/[0-9a-f](?=:[0-9a-f]+$)/, '0');
    assert.throws(() => decrypt(tampered), /Unsupported state or unable to authenticate data/);
  });
});
```

Run with:
```bash
cd ~/projects/Bubblepi-Store && node --test tests/crypto.test.ts
```

Expected: all 5 tests pass.

### Commit

```bash
git add -A
git commit -m "feat: AES-256-GCM credential encryption"
```

---

## Task 3: Rate Limiting

**Goal:** Prevent abuse on sensitive endpoints with in-memory token bucket rate limiter. No external dependencies.

### Files

| Action | File | Description |
|--------|------|-------------|
| Create | lib/rate-limit.ts | In-memory sliding window rate limiter |
| Modify | app/api/admin/auth/route.ts | Apply rate limit: 5/15min per IP |
| Modify | app/api/orders/route.ts | Apply rate limit: 10/h per IP |
| Modify | app/api/payments/create/route.ts | Apply rate limit: 10/h per IP |
| Modify | app/api/payments/webhook/route.ts | Apply rate limit: 100/min per IP |
| Modify | app/api/vouchers/validate/route.ts | Apply rate limit: 20/h per IP |

### Interfaces

- **Consumes:** Request IP (from headers or x-forwarded-for)
- **Produces:** 429 response with Retry-After header when exceeded

### Step-by-step

**Step 1: Create lib/rate-limit.ts**

```typescript
interface RateLimitConfig {
  windowMs: number;   // Time window in milliseconds
  maxRequests: number; // Max requests allowed in the window
}

interface RateLimitEntry {
  timestamps: number[]; // Sorted array of request timestamps
}

// Map<key, RateLimitEntry> — key is typically IP:endpoint
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup every 60s to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    // Remove entries older than the largest window (15 min = 900000ms)
    const cutoff = now - 900_000;
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Prevent the interval from keeping the process alive in tests
if (typeof setInterval !== 'undefined') {
  // In Node.js test runner, this is fine — server contexts only
}

/**
 * Check if a request should be rate limited.
 * Returns { allowed: boolean, retryAfter: number }
 *   - allowed: true if request is within limit
 *   - retryAfter: seconds until the window resets (0 if allowed)
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Calculate retry-after from the oldest timestamp in the window
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfter: 0 };
}

/**
 * Extract client IP from request, handling proxies.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
```

**Step 2: Apply rate limiter to each endpoint**

Pattern for each route:

```typescript
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit check
  const ip = getClientIp(request);
  const rateKey = `admin-auth:${ip}`;
  const { allowed, retryAfter } = checkRateLimit(rateKey, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  });

  if (!allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  // ... existing handler logic
}
```

Config per endpoint:

| Endpoint | windowMs | maxRequests | Rate key prefix |
|----------|----------|-------------|-----------------|
| POST /api/admin/auth | 15 min (900000) | 5 | `admin-auth:` |
| POST /api/orders | 1 hour (3600000) | 10 | `orders:` |
| POST /api/payments/create | 1 hour (3600000) | 10 | `payment-create:` |
| POST /api/payments/webhook | 1 min (60000) | 100 | `payment-webhook:` |
| POST /api/vouchers/validate | 1 hour (3600000) | 20 | `voucher-validate:` |

**Step 3: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: in-memory rate limiting on sensitive endpoints"
```

---

## Task 4: Storefront UX — Real-time Stock, Search, Skeleton

**Goal:** Make the storefront feel alive and responsive. Show stock urgency, enable product discovery, and provide loading states.

### Files

| Action | File | Description |
|--------|------|-------------|
| Create | components/ui/skeleton.tsx | Skeleton loading component (reuse shadcn pattern) |
| Create | components/product/product-grid-skeleton.tsx | Skeleton for product grid |
| Create | components/product/product-detail-skeleton.tsx | Skeleton for product detail page |
| Create | components/product/stock-badge.tsx | "Tersisa X" / "Stok habis" badge |
| Create | components/product/related-products.tsx | Related products section |
| Modify | app/products/page.tsx | Add debounced search, category filter, sort |
| Modify | app/products/[slug]/page.tsx | Add stock display, related products, skeleton |
| Modify | components.json or tailwind config | Ensure skeleton animation classes exist |
| Modify | app/globals.css | Add skeleton animation keyframes if missing |

### Interfaces

- **Consumes:** Product/Variant Prisma queries with stock count, existing /api/products routes
- **Produces:** Debounced client-side search with URL query params, skeleton loading states, related product queries

### Step-by-step

**Step 1: Create components/ui/skeleton.tsx**

```typescript
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
```

Add to app/globals.css if animate-pulse doesn't exist in Tailwind 4:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Step 2: Create components/product/stock-badge.tsx**

```tsx
interface StockBadgeProps {
  availableStock: number;
}

export function StockBadge({ availableStock }: StockBadgeProps) {
  if (availableStock <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
        Stok habis
      </span>
    );
  }

  if (availableStock <= 5) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
        Tersisa {availableStock}
      </span>
    );
  }

  return null; // Don't show anything when stock is healthy
}
```

**Step 3: Update app/products/page.tsx**

Add debounced search, category filter, and sort:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductGridSkeleton } from '@/components/product/product-grid-skeleton';

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? '');
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    const query = params.toString();
    router.replace(`/products${query ? `?${query}` : ''}`, { scroll: false });
    setIsLoading(true);
  }, [debouncedSearch, category, sort, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua</SelectItem>
            <SelectItem value="game">Game</SelectItem>
            <SelectItem value="streaming">Streaming</SelectItem>
            <SelectItem value="software">Software</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Default</SelectItem>
            <SelectItem value="price_asc">Harga termurah</SelectItem>
            <SelectItem value="price_desc">Harga termahal</SelectItem>
            <SelectItem value="popular">Terlaris</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product grid with loading state */}
      {isLoading ? <ProductGridSkeleton /> : <ProductGrid />}
    </div>
  );
}
```

**Step 4: Create skeleton components**

components/product/product-grid-skeleton.tsx — shows 8 skeleton cards in a grid.
components/product/product-detail-skeleton.tsx — shows image placeholder + 4 skeleton text lines.

**Step 5: Create components/product/related-products.tsx**

A server component that fetches products in the same category, excluding the current product, limited to 4 items.

**Step 6: Update app/products/[slug]/page.tsx**

Add stock badge for each variant variant, skeleton loading state, and related products section at the bottom.

**Step 7: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: storefront UX — stock indicator, search, filter, skeleton, related products"
```

---

## Task 5: Checkout & Order UX

**Goal:** Real-time feedback during checkout and order tracking. Payment countdown, live status polling, credential reveal UX.

### Files

| Action | File | Description |
|--------|------|-------------|
| Create | components/checkout/payment-countdown.tsx | 24h countdown timer |
| Create | components/order/order-status-poll.tsx | Auto-poll order status |
| Create | components/order/credential-display.tsx | Masked reveal + copy button |
| Create | components/order/order-timeline.tsx | Status history stepper |
| Modify | app/checkout/page.tsx (or relevant payment step) | Integrate countdown |
| Modify | app/orders/[id]/page.tsx | Integrate polling + credential display + timeline |

### Interfaces

- **Consumes:** Order status from API, expirationDate from Xendit invoice, credentials from fulfillOrder
- **Produces:** Client-side polling with 5s interval, copy-to-clipboard, timeline visualization

### Step-by-step

**Step 1: Create components/checkout/payment-countdown.tsx**

```tsx
'use client';

import { useState, useEffect } from 'react';

interface PaymentCountdownProps {
  expiresAt: string; // ISO date string
  onExpired?: () => void;
}

export function PaymentCountdown({ expiresAt, onExpired }: PaymentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Kedaluwarsa');
        setExpired(true);
        onExpired?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}d`);
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (expired) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
        <p className="font-semibold">Pembayaran kedaluwarsa</p>
        <p className="text-sm">Silakan lakukan pemesanan ulang</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
      <p className="text-sm font-medium">Sisa waktu pembayaran</p>
      <p className="text-2xl font-bold tabular-nums">{timeLeft}</p>
    </div>
  );
}
```

**Step 2: Create components/order/order-status-poll.tsx**

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderStatusPollProps {
  orderId: string;
  currentStatus: string;
}

const POLLING_STATUSES = ['PENDING', 'AWAITING_PAYMENT', 'PAID'];
const POLL_INTERVAL = 5000; // 5 seconds

export function OrderStatusPoll({ orderId, currentStatus }: OrderStatusPollProps) {
  const router = useRouter();

  useEffect(() => {
    if (!POLLING_STATUSES.includes(currentStatus)) {
      return; // Don't poll for terminal statuses
    }

    const interval = setInterval(() => {
      router.refresh(); // Re-fetch server components
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [orderId, currentStatus, router]);

  return null; // This is a logic-only component
}
```

**Step 3: Create components/order/credential-display.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, Check } from 'lucide-react';

interface CredentialDisplayProps {
  credential: string;
  label?: string;
}

export function CredentialDisplay({ credential, label = 'Akun' }: CredentialDisplayProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = credential.replace(/./g, '•');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(credential);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = credential;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
          {revealed ? credential : masked}
        </code>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRevealed(!revealed)}
          title={revealed ? 'Sembunyikan' : 'Tampilkan'}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopy} title="Salin">
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
```

**Step 4: Create components/order/order-timeline.tsx**

```tsx
interface TimelineStep {
  label: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step.completed
                  ? 'border-green-500 bg-green-50 dark:bg-green-900'
                  : step.current
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
              }`}
            >
              {step.completed ? (
                <span className="text-green-600 dark:text-green-400">✓</span>
              ) : (
                <span className="text-gray-400">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
          <div className="pt-1">
            <p
              className={`font-medium ${
                step.completed
                  ? 'text-green-700 dark:text-green-300'
                  : step.current
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-500'
              }`}
            >
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-sm text-muted-foreground">
                {new Date(step.timestamp).toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 5: Wire into order page**

In app/orders/[id]/page.tsx, add:

```tsx
import { OrderStatusPoll } from '@/components/order/order-status-poll';
import { CredentialDisplay } from '@/components/order/credential-display';
import { OrderTimeline } from '@/components/order/order-timeline';
import { PaymentCountdown } from '@/components/checkout/payment-countdown';

// Map order status to timeline steps
const timelineSteps = [
  { label: 'Pesanan Dibuat', key: 'created' },
  { label: 'Pembayaran Diterima', key: 'paid' },
  { label: 'Akun Dikirim', key: 'fulfilled' },
];

function buildTimeline(order: Order): TimelineStep[] {
  return timelineSteps.map((step) => ({
    label: step.label,
    timestamp: order[`${step.key}At`] ?? null,
    completed: order.status === 'FULFILLED' || (step.key === 'paid' && order.status !== 'PENDING' && order.status !== 'AWAITING_PAYMENT'),
    current: order.status === 'PENDING' && step.key === 'created',
  }));
}
```

**Step 6: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: checkout timer, order polling, credential reveal UX"
```

---

## Task 6: Admin Dashboard Metrics + Bulk Operations

**Goal:** Give admin operational visibility — revenue metrics, pending orders, low stock alerts, and better order management.

### Files

| Action | File | Description |
|--------|------|-------------|
| Modify | app/api/admin/stats/route.ts | Add revenue, pending orders, low-stock counts |
| Create | components/admin/dashboard-metrics.tsx | Display cards for revenue/orders/stock |
| Create | components/admin/low-stock-alert.tsx | Low-stock variant list |
| Create | components/admin/recent-orders-table.tsx | Recent orders table |
| Modify | app/api/admin/stock/bulk-upload/route.ts | Add format validation |
| Create | components/admin/order-filters.tsx | Status, date range, search filters |
| Verify | app/api/admin/orders/export/route.ts | CSV export exists and works |

### Interfaces

- **Consumes:** GET /api/admin/stats, GET /api/admin/orders, GET /api/admin/stock
- **Produces:** Admin dashboard page with real metrics, validated bulk upload, order filters

### Step-by-step

**Step 1: Enhance /api/admin/stats to return revenue metrics**

```typescript
// In the stats route handler, add these queries:
const now = new Date();

const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekStart = new Date(todayStart);
weekStart.setDate(weekStart.getDate() - weekStart.getDay());
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

const [todayRevenue, weekRevenue, monthRevenue, pendingOrders, lowStockVariants] =
  await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: todayStart }, status: 'FULFILLED' },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: weekStart }, status: 'FULFILLED' },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart }, status: 'FULFILLED' },
    }),
    db.order.count({ where: { status: { in: ['PENDING', 'AWAITING_PAYMENT'] } } }),
    db.variant.count({
      where: {
        accountStocks: {
          some: { status: 'AVAILABLE' },
        },
      },
    }),
    // Actually need to count variants with < 3 available stock:
    // This requires a raw query or computed field — use raw query for accuracy
  ]);
```

For low-stock variants with < 3 available, use Prisma raw query or compute via groupBy:

```typescript
const lowStockVariants = await db.$queryRaw<Array<{ id: string; name: string; available: bigint }>>`
  SELECT v.id, v.name, COUNT(as_.id) as available
  FROM "Variant" v
  LEFT JOIN "AccountStock" as_ ON as_."variantId" = v.id AND as_.status = 'AVAILABLE'
  GROUP BY v.id, v.name
  HAVING COUNT(as_.id) < 3
  ORDER BY available ASC
  LIMIT 20
`;
```

**Step 2: Verify /api/admin/orders/export**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: <admin-session-cookie>" \
  https://bubblepi-store.vercel.app/api/admin/orders/export
```

If the endpoint doesn't exist or errors, implement it:

```typescript
// GET /api/admin/orders/export
export async function GET(request: Request) {
  await requireAdmin();
  const orders = await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const csv = [
    'OrderNumber,CustomerEmail,Status,Total,Items,CreatedAt',
    ...orders.map((o) =>
      [
        o.orderNumber,
        o.email,
        o.status,
        o.total,
        o.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
        o.createdAt.toISOString(),
      ].join(',')
    ),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="orders-export.csv"',
    },
  });
}
```

**Step 3: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: admin dashboard metrics, bulk upload validation, order filters"
```

---

## Task 7: Email Templates Completion + Transactional Emails

**Goal:** Complete the email notification system with all required transactional emails and retry logic.

### Files

| Action | File | Description |
|--------|------|-------------|
| Verify | emails/OrderConfirmation.tsx | Ensure it renders correctly |
| Verify | emails/AccountDelivery.tsx | Ensure it renders correctly |
| Create | emails/PaymentReceived.tsx | Payment received (awaiting fulfillment) |
| Create | emails/OrderExpired.tsx | Order failed/expired notification |
| Create | emails/WarrantyClaimReceived.tsx | Warranty claim acknowledgement |
| Create | emails/LowStockAlert.tsx | Internal admin alert for low stock |
| Modify | app/api/payments/webhook/route.ts | Send PaymentReceived on PAID, OrderExpired on FAILED |
| Verify | lib/email.ts | Resend integration exists, add resend logic for failures |

### Interfaces

- **Consumes:** Resend client, order data, warranty claim data
- **Produces:** Transactional email sending with retry using existing resendCount field

### Step-by-step

**Step 1: Create emails/PaymentReceived.tsx**

Uses React Email patterns (same as existing templates):

```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface PaymentReceivedProps {
  customerName: string;
  orderNumber: string;
  orderUrl: string;
}

export function PaymentReceived({ customerName, orderNumber, orderUrl }: PaymentReceivedProps) {
  return (
    <Html>
      <Head />
      <Preview>Pembayaran Anda telah diterima — Pesanan #{orderNumber}</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <Container>
          <Heading>Pembayaran Diterima! 🎉</Heading>
          <Text>Halo {customerName},</Text>
          <Text>
            Pembayaran untuk pesanan #{orderNumber} telah kami terima. Tim kami
            sedang memproses pesanan Anda dan akan mengirimkan detail akun
            dalam waktu 1x24 jam.
          </Text>
          <Text>
            <a href={orderUrl}>Lihat status pesanan</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

**Step 2: Create emails/OrderExpired.tsx**

```tsx
// Similar pattern, but informs user payment window expired and they need to re-order
```

**Step 3: Create emails/WarrantyClaimReceived.tsx**

```tsx
// Acknowledges warranty claim receipt, provides expected resolution timeline
```

**Step 4: Create emails/LowStockAlert.tsx**

```tsx
// Internal email sent to admin when a variant has < 3 available stock
// Use process.env.ADMIN_EMAIL or TELEGRAM for delivery
```

**Step 5: Wire up in webhook handler**

In app/api/payments/webhook/route.ts, after updating order status to PAID:

```typescript
// Send PaymentReceived email (fire-and-forget)
try {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: order.email,
    subject: `Pembayaran Diterima — #${order.orderNumber}`,
    react: PaymentReceived({
      customerName: order.customerName ?? order.email,
      orderNumber: order.orderNumber,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
    }),
  });
} catch (error) {
  console.error('Failed to send PaymentReceived email:', error);
  // Increment resendCount for retry
  await db.order.update({
    where: { id: order.id },
    data: { resendCount: { increment: 1 } },
  });
}
```

**Step 6: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: complete email templates and transactional email wiring"
```

---

## Task 8: Revenue Features — Vouchers, Flash Sale, Trust Signals

**Goal:** Drive revenue with promotion tools (vouchers, flash sales) and build trust with social proof (sales count, reviews, urgency).

### Files

| Action | File | Description |
|--------|------|-------------|
| Verify | app/api/vouchers/validate/route.ts | End-to-end voucher flow works |
| Create | prisma/migrations/..._add_flash_sale_fields/ | Add salePrice, saleEndsAt to Variant |
| Modify | components/product/product-card.tsx | Show "Terjual X", sale badge, review rating |
| Modify | components/product/variant-selector.tsx | Show sale price with strikethrough + countdown |
| Create | components/product/sale-countdown.tsx | Flash sale countdown timer |

### Interfaces

- **Consumes:** Voucher model, Variant model (after migration), Review model, Order model (for fulfilled counts)
- **Produces:** Discounted prices, countdown timers, trust badges on product cards

### Step-by-step

**Step 1: Verify voucher system**

```bash
# Test voucher validation
curl -X POST https://bubblepi-store.vercel.app/api/vouchers/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST10", "cartTotal": 100000}'
```

If voucher validation works but discount isn't reflected in order total, trace the issue in the create-order flow.

**Step 2: Create flash sale migration**

```bash
cd ~/projects/Bubblepi-Store && npx prisma migrate dev --name add_flash_sale_fields
```

The migration should add to schema.prisma Variant model:

```prisma
salePrice        Decimal?   @map("sale_price")
saleEndsAt       DateTime?  @map("sale_ends_at")
```

**Step 3: Update product card with trust signals**

Show:
- "Terjual X" badge based on count of FULFILLED orders containing that product
- Review star rating (average from Review model)
- Urgency badge ("Tersisa 3" from Task 4)
- Flash sale badge with strikethrough price if sale is active

**Step 4: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: voucher validation, flash sale, trust signals"
```

---

## Task 9: Analytics Funnel + docs/DECISIONS.md

**Goal:** Track user behavior through the purchase funnel and document every architectural decision made.

### Files

| Action | File | Description |
|--------|------|-------------|
| Create | prisma/migrations/..._add_funnel_events/ | FunnelEvent model |
| Create | app/api/analytics/event/route.ts | POST endpoint for funnel events |
| Create | components/admin/analytics-funnel.tsx | Funnel conversion visualization |
| Modify | app/api/admin/stats/route.ts | Add funnel metrics |
| Create | docs/DECISIONS.md | Architectural decision record |

### Interfaces

- **Consumes:** FunnelEvent model, product/variant IDs from client-side events
- **Produces:** Funnel conversion rates, top products/abandoned variants in admin dashboard

### Step-by-step

**Step 1: Create FunnelEvent model migration**

Add to schema.prisma:

```prisma
model FunnelEvent {
  id        String   @id @default(cuid())
  sessionId String   @map("session_id")
  event     String   // VIEW_PRODUCT | ADD_TO_CART | CHECKOUT_START | PAYMENT_INITIATED | PAYMENT_SUCCESS
  productId String?  @map("product_id")
  variantId String?  @map("variant_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([sessionId])
  @@index([event, createdAt])
  @@map("funnel_events")
}
```

```bash
cd ~/projects/Bubblepi-Store && npx prisma migrate dev --name add_funnel_events
```

**Step 2: Create /api/analytics/event POST endpoint**

Fire-and-forget, rate-limited, no auth:

```typescript
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const eventSchema = z.object({
  sessionId: z.string().min(1),
  event: z.enum(['VIEW_PRODUCT', 'ADD_TO_CART', 'CHECKOUT_START', 'PAYMENT_INITIATED', 'PAYMENT_SUCCESS']),
  productId: z.string().optional(),
  variantId: z.string().optional(),
});

export async function POST(request: Request) {
  // Rate limit: 100 events per minute per IP
  const ip = getClientIp(request);
  const { allowed, retryAfter } = checkRateLimit(`analytics:${ip}`, {
    windowMs: 60_000,
    maxRequests: 100,
  });
  if (!allowed) {
    return Response.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  try {
    const body = await request.json();
    const data = eventSchema.parse(body);

    // Fire-and-forget: don't await the DB call for faster response
    db.funnelEvent.create({ data }).catch((err) => {
      console.error('Failed to log funnel event:', err);
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid event data', details: error.errors }, { status: 400 });
    }
    console.error('Analytics event error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 3: Create docs/DECISIONS.md**

```markdown
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
```

**Step 4: Build check**

```bash
cd ~/projects/Bubblepi-Store && pnpm build
```

Expected: 0 errors.

### Commit

```bash
git add -A
git commit -m "feat: analytics funnel tracking, decisions doc"
```

---

## Task 10: Deployment Readiness Checklist

**Goal:** Make the repo deployment-ready with proper config, documentation, and a zero-error build.

### Files

| Action | File | Description |
|--------|------|-------------|
| Create | vercel.json | Build command, cron jobs, rewrites |
| Modify | README.md | Env vars table, go-live checklist, rollback plan |
| Verify | pnpm build | 0 errors final verification |

### Interfaces

- **Consumes:** All previous task outputs, existing repo structure
- **Produces:** Deployment-ready configuration and documentation

### Step-by-step

**Step 1: Create vercel.json**

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/check-expired-orders",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/retry-emails",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/low-stock-alert",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Step 2: Update README.md**

Add sections:

1. **Environment Variables** — complete table with all vars, descriptions, required/optional
2. **Go-Live Checklist:**
   - [ ] Switch Xendit to production (change API key from xnd_development_ to xnd_production_)
   - [ ] Generate ENCRYPTION_KEY: `openssl rand -hex 32`
   - [ ] Run credential migration: `npx tsx scripts/encrypt-credentials.ts`
   - [ ] Verify webhook URL in Xendit dashboard → Settings → Webhooks
   - [ ] Set cron job secret in Vercel Environment Variables
   - [ ] Verify Resend domain sending (DNS DKIM/SPF setup)
   - [ ] Test full order flow end-to-end on production
3. **Rollback Plan:**
   - Vercel: Enable Automatic Rollback in Production Deployments
   - Database: `prisma migrate down` (with caution — prefer forward fix)
   - If credential encryption causes issues: restore from backup, set ENCRYPTION_KEY to empty to skip decryption
   - Rate limiting: clear env var or set high thresholds as escape hatch

**Step 3: Final build verification**

```bash
cd ~/projects/Bubblepi-Store && pnpm build 2>&1
```

Expected output: All routes compiled successfully, 0 TypeScript errors, 0 ESLint errors.

### Commit

```bash
git add -A
git commit -m "chore: deployment readiness — vercel.json, README, go-live checklist"
```

---

## Summary

| # | Task | Files Changed | Key Risk |
|---|------|--------------|----------|
| 1 | Security & Stability | ~15 files | Missing a route during audit |
| 2 | Credential Encryption | 7 files | Existing credentials lost during migration (mitigation: backup + batch processing) |
| 3 | Rate Limiting | 6 files | In-memory resets on cold start (documented) |
| 4 | Storefront UX | 8 files | Skeleton not matching real layout |
| 5 | Checkout & Order UX | 6 files | Polling too aggressive (5s OK) |
| 6 | Admin Dashboard | 6 files | Performance of stats queries on large dataset |
| 7 | Email Templates | 7 files | Missing template variables |
| 8 | Revenue Features | 5 files | Flash sale migration on production DB |
| 9 | Analytics + Docs | 5 files | Fire-and-forget events silently failing |
| 10 | Deployment Readiness | 3 files | vercel.json cron syntax |

**Total estimated effort:** 5-7 days for a single developer working full-time.
