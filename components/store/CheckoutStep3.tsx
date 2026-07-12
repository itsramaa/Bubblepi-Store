"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface Props {
  orderId: string
  paymentUrl: string | null
}

export default function CheckoutStep3({ orderId, paymentUrl }: Props) {
  const [status, setStatus] = useState("AWAITING_PAYMENT")
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (data.data?.status === "FULFILLED" || data.data?.status === "FAILED") {
        setStatus(data.data.status)
        clearInterval(interval)
        router.refresh()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [orderId, router])

  return (
    <div className="text-center space-y-6 py-4">
      <h2 className="text-xl font-bold">Menunggu Pembayaran</h2>
      <p className="text-muted-foreground">Silakan selesaikan pembayaran Anda.</p>

      {paymentUrl && (
        <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
          <Button className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Bayar Sekarang
          </Button>
        </a>
      )}

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Status: {status}</p>
        <Link href={`/orders/${orderId}`}>
          <Button variant="link">Lacak Pesanan</Button>
        </Link>
      </div>
    </div>
  )
}
