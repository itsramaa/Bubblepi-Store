import { goAPI } from "@/lib/api-client"

/**
 * Tracks a frontend funnel/analytics event by sending it to the Go backend.
 * Client-safe — can be imported in both client and server components.
 */
export async function trackEvent(eventType: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    const sessionId = typeof window !== "undefined" ? localStorage.getItem("analytics_session_id") || "" : ""
    
    // Generate a quick session ID if missing
    let finalSessionId = sessionId
    if (typeof window !== "undefined" && !sessionId) {
      finalSessionId = Math.random().toString(36).substring(2, 15)
      localStorage.setItem("analytics_session_id", finalSessionId)
    }

    await fetch(goAPI("/analytics/event"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: finalSessionId,
        eventType,
        metadata: metadata || {},
      }),
      credentials: "include",
    })
  } catch (err) {
    // Fail silently to not disrupt user experience
    console.error("Failed to track event:", err)
  }
}