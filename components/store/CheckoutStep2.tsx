"use client"

import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Konfirmasi Pesanan</h2>
      <div className="space-y-1 text-sm">
        <p><span className="text-muted-foreground">Nama:</span> {formData.customerName}</p>
        <p><span className="text-muted-foreground">Email:</span> {formData.customerEmail}</p>
        <p><span className="text-muted-foreground">Pembayaran:</span> {formData.paymentMethod}{formData.bankCode ? ` - ${formData.bankCode}` : ""}</p>
      </div>
      <Separator />
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.variantId} className="flex justify-between text-sm">
            <span>{item.productName} - {item.variantName} x{item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
        <div className="flex justify-between text-sm"><span>PPN 11%</span><span>{formatPrice(getTax())}</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">{formatPrice(getTotal())}</span></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Kembali</Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Memproses..." : "Bayar Sekarang"}</Button>
      </div>
    </div>
  )
}

// Need useState import
import { useState } from "react"
