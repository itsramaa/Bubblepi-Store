'use client'
import { useState, useEffect } from 'react'

interface SaleCountdownProps {
  saleEndsAt: string // ISO date
}

export function SaleCountdown({ saleEndsAt }: SaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    function calculate() {
      const now = Date.now()
      const end = new Date(saleEndsAt).getTime()
      const diff = end - now
      if (diff <= 0) { setExpired(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(h > 0 ? `${h}j ${m}m ${s}d` : `${m}m ${s}d`)
    }
    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [saleEndsAt])

  if (expired) return null
  return (
    <span className="text-xs text-red-600 font-medium tabular-nums">
      Flash sale berakhir dalam {timeLeft}
    </span>
  )
}
