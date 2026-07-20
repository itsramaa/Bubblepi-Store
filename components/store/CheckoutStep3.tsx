"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Clock, QrCode, CheckCircle2, RefreshCw, MessageCircle, Copy, Check } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface Props {
  orderId: string
  paymentUrl: string | null
  createdAt: string
}

const PAID_STATUSES = ["PAID", "DELIVERED", "PROCESSING"]

const PAYMENT_INSTRUCTIONS: Record<string, { title: string; steps: string[] }> = {
  QRIS: {
    title: "Cara Bayar via QRIS",
    steps: [
      "Klik \"Bayar Sekarang\" untuk membuka halaman pembayaran Xendit",
      "Scan QR Code menggunakan GoPay, OVO, DANA, ShopeePay, atau mobile banking",
      "Masukkan nominal yang tertera dan konfirmasi pembayaran",
      "Akun akan dikirim otomatis ke email setelah pembayaran terkonfirmasi",
    ],
  },
  VA: {
    title: "Cara Bayar via Virtual Account",
    steps: [
      "Klik \"Bayar Sekarang\" untuk melihat nomor Virtual Account",
      "Transfer ke nomor VA dari ATM, mobile banking, atau internet banking",
      "Pastikan nominal transfer tepat sesuai tagihan",
      "Akun akan dikirim otomatis ke email setelah transfer terkonfirmasi",
    ],
  },
}

export default function CheckoutStep3({ orderId, paymentUrl, createdAt }: Props) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState("")
  const [expired, setExpired] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [paid, setPaid] = useState(false)
  const [polling, setPolling] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Detect payment method from paymentUrl (rough heuristic)
  const isVA = paymentUrl?.toLowerCase().includes("virtual") || paymentUrl?.toLowerCase().includes("bank")
  const instructionKey = isVA ? "VA" : "QRIS"
  const instruction = PAYMENT_INSTRUCTIONS[instructionKey]

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

  async function handleCopyUrl() {
    if (!paymentUrl) return
    try {
      await navigator.clipboard.writeText(paymentUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {}
  }

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

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowQr(!showQr)}
            >
              <QrCode className="h-4 w-4" />
              {showQr ? "Sembunyikan QR" : "QR Code"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyUrl}
            >
              {copiedUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copiedUrl ? "Disalin!" : "Salin Link"}
            </Button>
          </div>

          {showQr && (
            <div className="flex flex-col items-center gap-3 p-4 md:p-6 border rounded-xl bg-white">
              <QRCodeSVG value={paymentUrl} size={200} />
              <p className="text-xs text-muted-foreground text-center">
                Scan QR ini dari aplikasi e-wallet atau mobile banking kamu
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment instructions */}
      {!expired && (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-semibold">{instruction.title}</p>
          <ol className="space-y-2">
            {instruction.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
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

      {/* WA help link */}
      <div className="text-center pt-1">
        <a
          href="https://wa.me/6281234567890?text=Halo%2C+saya+butuh+bantuan+dengan+pesanan+saya"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Butuh bantuan? Chat WhatsApp
        </a>
      </div>
    </div>
  )
}
