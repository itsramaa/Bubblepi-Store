"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { X, ShoppingBag } from "lucide-react"
import { goAPI } from "@/lib/api-client"

interface ActivityItem {
  firstName: string
  city: string
  productName: string
}

function randomInterval() {
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

  const isCheckout = pathname?.startsWith("/checkout")

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

    hideTimerRef.current = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => {
        setVisible(false)
        setLeaving(false)
      }, 400)
    }, 4_000)
  }, [])

  useEffect(() => {
    let cancelled = false
    let timerId: ReturnType<typeof setTimeout> | null = null

    const run = () => {
      if (cancelled) return
      showNext()
      const delay = randomInterval()
      timerId = setTimeout(run, delay)
    }

    async function fetchPool() {
      try {
        const res = await fetch(goAPI("/api/live-activity"), { credentials: "include" })
        if (!res.ok) return
        const data: ActivityItem[] = await res.json()
        if (cancelled || data.length === 0) return
        poolRef.current = data
        timerId = setTimeout(run, 5_000)
      } catch {}
    }

    fetchPool()

    return () => {
      cancelled = true
      if (timerId) clearTimeout(timerId)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [showNext])

  if (isCheckout || !visible || !current) return null

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
      <div className="flex items-center gap-3 bg-card border border-hairline shadow-card-hover rounded-md px-4 py-3 relative">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <p className="text-body-sm font-medium leading-snug">
            <span className="text-primary font-semibold">{current.firstName}</span>
            {" "}dari{" "}
            <span className="font-semibold">{current.city}</span>
          </p>
          <p className="text-caption-sm text-muted truncate">
            baru beli <span className="font-medium text-ink">{current.productName}</span>
          </p>
        </div>

        <button
          onClick={dismiss}
          aria-label="Tutup notifikasi"
          className="absolute top-2 right-2 text-muted hover:text-ink transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}