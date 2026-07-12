"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import type { CheckoutFormData } from "@/types"

interface Props {
  formData: CheckoutFormData
  onSubmit: () => void
  onBack: () => void
}

export default function CheckoutStep2({ formData, onSubmit, onBack }: Props) {
  const { items, getSubtotal, getTax, getTotal } = useCart()
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    await onSubmit()
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Konfirmasi Pesanan</h2>
        <p className="text-sm text-muted-foreground">Pastikan data sudah benar sebelum membayar.</p>
      </div>

      {/* Customer info */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nama</span>
          <span className="font-medium">{formData.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{formData.customerEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pembayaran</span>
          <span className="font-medium">
            {formData.paymentMethod}{formData.bankCode ? ` — ${formData.bankCode}` : ""}
          </span>
        </div>
      </div>

      <Separator />

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.variantId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.productName} <span className="text-foreground">({item.variantName})</span> ×{item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(getSubtotal())}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>PPN 11%</span>
          <span>{formatPrice(getTax())}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-1">
          <span>Total</span>
          <span className="text-primary">{formatPrice(getTotal())}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
          Kembali
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
          ) : (
            "Bayar Sekarang"
          )}
        </Button>
      </div>
    </div>
  )
}
