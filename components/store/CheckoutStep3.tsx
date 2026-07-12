"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Clock, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface Props {
  orderId: string
  paymentUrl: string | null
  createdAt: string
}

export default function CheckoutStep3({ orderId, paymentUrl, createdAt }: Props) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState("")
  const [expired, setExpired] = useState(false)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    const expiry = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000)

    function tick() {
      const diff = expiry.getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setTimeLeft("00:00:00")
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold">Selesaikan Pembayaran</h2>
        <p className="text-sm text-muted-foreground">
          Setelah bayar, akun akan dikirim otomatis ke email kamu.
        </p>
      </div>

      {/* Countdown */}
      <Card className={expired ? "border-destructive" : "border-amber-200 dark:border-amber-800"}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Sisa waktu pembayaran</p>
          <p className={`text-3xl font-mono font-bold ${expired ? "text-destructive" : "text-amber-600"}`}>
            {timeLeft || "24:00:00"}
          </p>
          {expired && <p className="text-xs text-destructive mt-1">Invoice kedaluwarsa. Buat pesanan baru.</p>}
        </CardContent>
      </Card>

      {/* QR Toggle */}
      {paymentUrl && !expired && (
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowQr(!showQr)}
          >
            <QrCode className="h-4 w-4" />
            {showQr ? "Sembunyikan QR" : "Bayar via QR Code"}
          </Button>

          {showQr && (
            <div className="flex flex-col items-center gap-2 p-4 border rounded-xl bg-white">
              <QRCodeSVG value={paymentUrl} size={180} />
              <p className="text-xs text-muted-foreground">Scan untuk bayar dari HP lain</p>
            </div>
          )}
        </div>
      )}

      {paymentUrl && !expired && (
        <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
          <Button className="w-full gap-2" size="lg">
            Bayar Sekarang
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      )}

      {expired && (
        <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
          Kembali ke Toko
        </Button>
      )}

      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={() => router.push(`/orders/${orderId}`)}
      >
        Cek Status Pesanan →
      </Button>
    </div>
  )
}
