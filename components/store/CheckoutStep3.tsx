"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Clock, QrCode, CheckCircle2, RefreshCw } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface Props {
  orderId: string
  paymentUrl: string | null
  createdAt: string
}

const PAID_STATUSES = ["PAID", "FULFILLED", "PENDING_STOCK"]

export default function CheckoutStep3({ orderId, paymentUrl, createdAt }: Props) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState("")
  const [expired, setExpired] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [paid, setPaid] = useState(false)
  const [polling, setPolling] = useState(true)

  // Countdown timer
  useEffect(() => {
    const expiry = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000)
    function tick() {
      const diff = expiry.getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setTimeLeft("00:00:00")
        setPolling(false)
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [createdAt])

  // Auto-poll payment status every 5s
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (data.success && PAID_STATUSES.includes(data.data?.status)) {
        setPaid(true)
        setPolling(false)
        // Redirect ke order status page setelah 2 detik
        setTimeout(() => router.push(`/orders/${orderId}`), 2000)
      }
    } catch {}
  }, [orderId, router])

  useEffect(() => {
    if (!polling) return
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [polling, checkStatus])

  if (paid) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400">Pembayaran Diterima!</h2>
          <p className="text-sm text-muted-foreground mt-1">Akun kamu sedang diproses, cek email sebentar lagi.</p>
        </div>
        <p className="text-xs text-muted-foreground animate-pulse">Mengalihkan ke halaman pesanan...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold">Selesaikan Pembayaran</h2>
        <p className="text-sm text-muted-foreground">
          Setelah bayar, akun dikirim otomatis ke email kamu.
        </p>
      </div>

      {/* Countdown */}
      <Card className={expired ? "border-destructive" : "border-amber-200 dark:border-amber-800"}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Sisa waktu pembayaran</p>
          <p className={`text-4xl font-mono font-bold tracking-wider ${expired ? "text-destructive" : "text-amber-600"}`}>
            {timeLeft || "24:00:00"}
          </p>
          {expired && (
            <p className="text-xs text-destructive mt-1">Invoice kedaluwarsa. Buat pesanan baru.</p>
          )}
        </CardContent>
      </Card>

      {/* Polling indicator */}
      {polling && !expired && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Menunggu konfirmasi pembayaran...</span>
        </div>
      )}

      {/* Payment actions */}
      {paymentUrl && !expired && (
        <div className="space-y-3">
          <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full gap-2 bg-[#595B83] hover:bg-[#595B83]/90" size="lg">
              Bayar Sekarang
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowQr(!showQr)}
          >
            <QrCode className="h-4 w-4" />
            {showQr ? "Sembunyikan QR Code" : "Tampilkan QR Code"}
          </Button>

          {showQr && (
            <div className="flex flex-col items-center gap-3 p-6 border rounded-xl bg-white">
              <QRCodeSVG value={paymentUrl} size={200} />
              <p className="text-xs text-muted-foreground text-center">
                Scan QR ini dari aplikasi e-wallet atau mobile banking kamu
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={() => router.push(`/orders/${orderId}`)}
        >
          Cek Status Pesanan →
        </Button>
        {expired && (
          <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
            Kembali ke Toko
          </Button>
        )}
      </div>
    </div>
  )
}
