/**
 * Internal API client for calling Go backend from Next.js.
 * Server-only — uses X-Internal-Token for Next.js → Go authentication.
 */
const BASE = process.env.GO_API_URL || process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8081"
const INTERNAL_TOKEN = process.env.GO_INTERNAL_TOKEN || ""

export function getBaseUrl(): string {
  return BASE
}

function getInternalHeaders(init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Internal-Token": INTERNAL_TOKEN,
  }
  // Copy/merge from init if provided
  if (init?.headers) {
    const raw = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : { ...(init.headers as Record<string, string>) }
    Object.assign(headers, raw)
  }
  return headers
}

export async function fetchFromGo(endpoint: string, init?: RequestInit): Promise<Response> {
  const url = `${BASE}/api/v1${endpoint}`
  const opts: RequestInit = {
    ...init,
    headers: getInternalHeaders(init),
    next: init?.next || { revalidate: 0 },
  }
  return fetch(url, opts)
}

export function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.text().then((text) => {
      let errMsg = text
      try { errMsg = JSON.parse(text).error ?? text } catch {}
      throw new Error(`Go API error ${res.status}: ${errMsg}`)
    })
  }
  return res.json() as Promise<T>
}

/**
 * Client-side helper for calling Go backend directly from browser.
 * Uses NEXT_PUBLIC_GO_API_URL (public env var, exposed to browser).
 * For server components, use fetchFromGo() instead.
 */
const CLIENT_BASE = process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8081"

export function goAPI(path: string): string {
  const cleaned = path.replace(/^\/api\//, "/api/v1/")
  return `${CLIENT_BASE}${cleaned}`
}