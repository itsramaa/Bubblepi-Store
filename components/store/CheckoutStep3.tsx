"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle2, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Props {
  orderId: string
  paymentUrl: string | null
}

export default function CheckoutStep3({ orderId, paymentUrl }: Props) {
  const [status, setStatus] = useState("AWAITING_PAYMENT")
  const [polling, setPolling] = useState(true)
  const router = useRouter()

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
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="gap-1.5">
          {polling && <RefreshCw className="h-3 w-3 animate-spin" />}
          {isFulfilled ? "Lunas" : "Menunggu Pembayaran"}
        </Badge>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {paymentUrl && !isFulfilled && (
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
