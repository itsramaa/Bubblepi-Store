"use client"

import { useState, useEffect } from "react"
import { fetchFromGo, parseJson } from "@/lib/api-client"

interface LiveOrder {
  orderNumber: string
  paidAt: string | null
  productNames: string[]
}

export function LiveFulfillmentBadge() {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    fetchFromGo("/live-activity")
      .then((res) => parseJson<{ orders: LiveOrder[] }>(res))
      .then((data) => {
        const lastOrder = data.orders?.[0] ?? null
        if (!lastOrder?.paidAt) {
          setText(null)
          return
        }
        const minutesAgo = Math.floor((Date.now() - new Date(lastOrder.paidAt).getTime()) / 60000)
        const timeText = minutesAgo < 60 ? `${minutesAgo} menit lalu` : `${Math.floor(minutesAgo / 60)} jam lalu`
        const names = lastOrder.productNames?.join(", ") ?? "Produk"
        setText(`Terakhir fulfill: ${names} — ${timeText}`)
      })
      .catch(() => setText(null))
  }, [])

  if (!text) return null

  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-body-sm text-[#333456]">
      <span className="animate-pulse">⚡</span>
      <span>{text}</span>
    </div>
  )
}