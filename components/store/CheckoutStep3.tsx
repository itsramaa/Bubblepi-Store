"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle2, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"

const XENDIT_EXPIRY_HOURS = 24

interface Props {
  orderId: string
  paymentUrl: string | null
  createdAt: string
}

export default function CheckoutStep3({ orderId, paymentUrl, createdAt }: Props) {
  const [status, setStatus] = useState("AWAITING_PAYMENT")
  const [polling, setPolling] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Countdown
  useEffect(() => {
    const expiry = new Date(createdAt).getTime() + XENDIT_EXPIRY_HOURS * 60 * 60 * 1000
    function tick() {
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [createdAt])

  // Polling
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      const s = data.data?.status
      if (s === "FULFILLED" || s === "FAILED") {
        setStatus(s)
        setPolling(false)
        clearInterval(interval)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [orderId, polling])

  const isFulfilled = status === "FULFILLED"
  const hours = Math.floor(secondsLeft / 3600)
  const mins = Math.floor((secondsLeft % 3600) / 60)
  const secs = secondsLeft % 60
  const expired = secondsLeft === 0 && !isFulfilled

  return (
    <div className="text-center space-y-6 py-6">
      {isFulfilled ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Pembayaran Berhasil!</h2>
          <p className="text-muted-foreground text-sm">Akun sudah dikirim ke email kamu.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold">Menunggu Pembayaran</h2>
          <p className="text-muted-foreground text-sm">Selesaikan pembayaran untuk mendapatkan akun.</p>

          {/* Countdown */}
          {!expired ? (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Kedaluwarsa dalam</span>
              <span className="font-mono font-bold tabular-nums text-amber-600">
                {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          ) : (
            <p className="text-sm text-destructive font-medium">Invoice sudah kedaluwarsa</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="gap-1.5">
          {polling && <RefreshCw className="h-3 w-3 animate-spin" />}
          {isFulfilled ? "Lunas" : expired ? "Kedaluwarsa" : "Menunggu Pembayaran"}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {paymentUrl && !isFulfilled && !expired && (
          <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 w-full sm:w-auto">
              <ExternalLink className="h-4 w-4" />
              Bayar Sekarang
            </Button>
          </a>
        )}
        <Link href={`/orders/${orderId}`}>
          <Button variant="outline" className="w-full sm:w-auto">
            Lacak Pesanan
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">Order ID: {orderId}</p>
    </div>
  )
}
