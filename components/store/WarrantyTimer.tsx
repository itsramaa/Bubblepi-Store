"use client"

import { useState, useEffect } from "react"

interface WarrantyItem {
  variantId: string
  variantName: string
  productName: string
  price: number
  warrantyOptionId?: string | null
}

interface WarrantyTimerProps {
  paidAt: string | Date
  items: WarrantyItem[]
  warrantyDurationDays?: number // default warranty days if no specific warranty
}

function calculateRemaining(paidAt: string | Date, warrantyDays: number) {
  const expiry = new Date(new Date(paidAt).getTime() + warrantyDays * 86400000)
  const remainingMs = expiry.getTime() - Date.now()
  if (remainingMs <= 0) return { expired: true, days: 0, hours: 0, percent: 0 }
  const total = warrantyDays * 86400000
  return {
    expired: false,
    days: Math.floor(remainingMs / 86400000),
    hours: Math.floor((remainingMs % 86400000) / 3600000),
    percent: Math.max(0, Math.min(100, (remainingMs / total) * 100)),
  }
}

export function WarrantyTimer({ paidAt, items, warrantyDurationDays = 7 }: WarrantyTimerProps) {
  // Use warranty option if present, otherwise use default
  const warrantyDays = items.reduce((min, i) => {
    if (i.warrantyOptionId) {
      // Has warranty - assume 7 or 30 days based on option
      // For now use 7 as default, in real app would look up warranty option
      return min
    }
    return warrantyDurationDays
  }, warrantyDurationDays)

  const [remaining, setRemaining] = useState(() => calculateRemaining(paidAt, warrantyDays))

  useEffect(() => {
    const interval = setInterval(
      () => setRemaining(calculateRemaining(paidAt, warrantyDays)),
      60000
    )
    return () => clearInterval(interval)
  }, [paidAt, warrantyDays])

  const color =
    remaining.percent > 50 ? "bg-green-500" : remaining.percent > 20 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="rounded-lg border border-[#F4ABC4] bg-[#F4ABC4]/10 p-4">
      <h4 className="mb-2 font-semibold text-[#333456]">Status Garansi</h4>
      {remaining.expired ? (
        <p className="text-sm text-gray-500">Garansi sudah berakhir</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#333456]">
            Aktif — {remaining.days} hari {remaining.hours} jam lagi
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${remaining.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
