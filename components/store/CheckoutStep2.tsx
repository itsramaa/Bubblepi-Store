"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Loader2, Gift, Plus } from "lucide-react"
import { toast } from "sonner"
import type { CheckoutFormData } from "@/types"

interface Props {
  formData: CheckoutFormData
  onSubmit: () => void
  onBack: () => void
  submitting?: boolean
}

export default function CheckoutStep2({ formData, onSubmit, onBack, submitting = false }: Props) {
  const { items, getSubtotal, getTax, getTotal } = useCart()
  const [voucherCode, setVoucherCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [voucherId, setVoucherId] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [upsells, setUpsells] = useState<any[]>([])

  const totalAfterDiscount = getTotal() - discount

  useEffect(() => {
    // Fetch upsell products
    if (items.length > 0) {
      fetch(`/api/products/upsell?excludeId=${items[0].productId}`)
        .then((r) => r.json())
        .then((d) => setUpsells(d.products || []))
        .catch(() => {})
    }
  }, [items])

  async function validateVoucher() {
    if (!voucherCode.trim()) return
    setValidating(true)
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, total: getTotal() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDiscount(data.voucher.discount)
      setVoucherId(data.voucher.id)
      toast.success(`Diskon ${data.voucher.discount.toLocaleString("id-ID")}!`)
    } catch (e: any) {
      toast.error(e.message)
      setDiscount(0)
      setVoucherId(null)
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Konfirmasi Pesanan</h2>
        <p className="text-sm text-muted-foreground">Pastikan data sudah benar sebelum membayar.</p>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">{formData.customerName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{formData.customerEmail}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Pembayaran</span><span className="font-medium">{formData.paymentMethod}{formData.bankCode ? ` — ${formData.bankCode}` : ""}</span></div>
      </div>

      <Separator />

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.variantId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.productName} <span className="text-foreground">({item.variantName})</span> ×{item.quantity}</span>
            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Voucher */}
      <div className="p-3 rounded-lg border bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Punya kode promo?</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="MASUKKAN KODE"
            className="text-xs uppercase"
            disabled={voucherId !== null}
          />
          {voucherId ? (
            <Button size="sm" variant="outline" onClick={() => { setVoucherCode(""); setDiscount(0); setVoucherId(null) }}>Hapus</Button>
          ) : (
            <Button size="sm" onClick={validateVoucher} disabled={validating || !voucherCode}>{validating ? "..." : "Pakai"}</Button>
          )}
        </div>
      </div>

      {/* Upsell */}
      {upsells.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5"><Plus className="h-4 w-4 text-primary" /> Lengkapi dengan</p>
          {upsells.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs">{p.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(p.variants?.[0]?.price ?? 0)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">+ Tambah</Button>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
        {discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatPrice(discount)}</span></div>}
        <div className="flex justify-between text-muted-foreground"><span>PPN 11%</span><span>{formatPrice(getTax())}</span></div>
        <div className="flex justify-between text-base font-bold pt-1">
          <span>Total</span>
          <span className="text-primary">{formatPrice(totalAfterDiscount)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={submitting}>Kembali</Button>
        <Button className="flex-1" onClick={onSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Bayar Sekarang"}
        </Button>
      </div>
    </div>
  )
}
