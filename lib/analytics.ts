let sessionId: string | null = null

function getSessionId(): string {
  if (sessionId) return sessionId
  if (typeof window === "undefined") return "ssr"
  sessionId = sessionStorage.getItem("_sid") ?? crypto.randomUUID()
  sessionStorage.setItem("_sid", sessionId)
  return sessionId
}

export function trackEvent(
  event: "VIEW_PRODUCT" | "ADD_TO_CART" | "CHECKOUT_START" | "PAYMENT_INITIATED" | "PAYMENT_SUCCESS",
  meta?: { productId?: string; variantId?: string }
) {
  if (typeof window === "undefined") return
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: getSessionId(), event, ...meta }),
  }).catch(() => {}) // fire-and-forget, silent fail
}
