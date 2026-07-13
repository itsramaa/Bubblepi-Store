"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { X, ShoppingBag } from "lucide-react"

interface ActivityItem {
  firstName: string
  city: string
  productName: string
}

function randomInterval() {
  // 30–60 seconds in ms
  return Math.floor(Math.random() * 30_000) + 30_000
}

export default function LiveActivityToast() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [current, setCurrent] = useState<ActivityItem | null>(null)
  const poolRef = useRef<ActivityItem[]>([])
  const indexRef = useRef(0)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Don't render on checkout pages
  const isCheckout = pathname?.startsWith("/checkout")
  if (isCheckout) return null

  const dismiss = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setLeaving(true)
    setTimeout(() => {
      setVisible(false)
      setLeaving(false)
    }, 400)
  }, [])

  const showNext = useCallback(() => {
    const pool = poolRef.current
    if (pool.length === 0) return
    const item = pool[indexRef.current % pool.length]
    indexRef.current++
    setCurrent(item)
    setLeaving(false)
    setVisible(true)

    // Auto-hide after 4s
    hideTimerRef.current = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => {
        setVisible(false)
        setLeaving(false)
      }, 400)
    }, 4_000)
  }, [])

  const scheduleNext = useCallback(() => {
    const delay = randomInterval()
    nextTimerRef.current = setTimeout(() => {
      showNext()
      scheduleNext()
    }, delay)
  }, [showNext])

  useEffect(() => {
    let cancelled = false

    async function fetchPool() {
      try {
        const res = await fetch("/api/live-activity")
        if (!res.ok) return
        const data: ActivityItem[] = await res.json()
        if (cancelled || data.length === 0) return
        poolRef.current = data
        // Start the first toast after a short delay, then schedule repeats
        nextTimerRef.current = setTimeout(() => {
          showNext()
          scheduleNext()
        }, 5_000)
      } catch {
        // silently fail — non-critical
      }
    }

    fetchPool()

    return () => {
      cancelled = true
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current)
    }
  }, [showNext, scheduleNext])

  if (!visible || !current) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-6 left-4 z-50 max-w-xs w-full sm:w-auto",
        "transition-all duration-400 ease-in-out",
        leaving
          ? "-translate-x-full opacity-0"
          : "translate-x-0 opacity-100",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 bg-card border shadow-lg rounded-xl px-4 py-3 relative">
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-primary" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-medium leading-snug">
            <span className="text-primary font-semibold">{current.firstName}</span>
            {" "}dari{" "}
            <span className="font-semibold">{current.city}</span>
          </p>
          <p className="text-xs text-muted-foreground truncate">
            baru beli <span className="font-medium text-foreground">{current.productName}</span>
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Tutup notifikasi"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
