interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup entries older than 1 hour every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 3600_000)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}, 5 * 60 * 1000).unref()

/**
 * Check if a key has exceeded the rate limit.
 * Enhancement 4: Returns remaining + limit for X-RateLimit headers.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number; remaining: number; limit: number } {
  const now = Date.now()
  const entry = store.get(key) ?? { timestamps: [] }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    store.set(key, entry)
    return { allowed: false, retryAfter, remaining: 0, limit }
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return { allowed: true, retryAfter: 0, remaining: limit - entry.timestamps.length, limit }
}

/**
 * Get client IP from NextRequest headers.
 * Handles x-forwarded-for (Vercel/proxies) and falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return "unknown"
}
