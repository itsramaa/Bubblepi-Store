"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Gift, Tag, X, Info } from "lucide-react"
import { toast } from "sonner"
import type { CheckoutFormData } from "@/types"

interface Props {
  formData: CheckoutFormData
  onSubmit: (voucherId?: string, discountAmount?: number) => void
  onBack: () => void
  submitting?: boolean
}

// Xendit fee info — informational only, tidak ditambahkan ke total
const XENDIT_FEE = {
  QRIS: "Biaya QRIS: 0.7% (ditanggung Xendit)",
  VA: "Biaya VA: Rp 4.000 (ditanggung Xendit)",
}

export default function CheckoutStep2({ formData, onSubmit, onBack, submitting = false }: Props) {
  const { items, getSubtotal, getTotal } = useCart()
  const [voucherCode, setVoucherCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [voucherId, setVoucherId] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [upsells, setUpsells] = useState<Array<{ id: string; name: string; variants: Array<{ price: number }> }>>([])

  const subtotal = getSubtotal()
  const totalAfterDiscount = Math.max(subtotal - discount, 0)

  useEffect(() => {
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
        body: JSON.stringify({ code: voucherCode, total: subtotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDiscount(data.voucher.discount)
      setVoucherId(data.voucher.id)
      toast.success(`Voucher berhasil! Hemat ${formatPrice(data.voucher.discount)}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Voucher tidak valid")
      setDiscount(0)
      setVoucherId(null)
    } finally {
      setValidating(false)
    }
  }

  function removeVoucher() {
    setVoucherCode("")
    setDiscount(0)
    setVoucherId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Konfirmasi Pesanan</h2>
        <p className="text-sm text-muted-foreground">Pastikan semua data sudah benar.</p>
      </div>

      {/* Customer info */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nama</span>
          <span className="font-medium">{formData.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{formData.customerEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Metode Bayar</span>
          <span className="font-medium">
            {formData.paymentMethod}{formData.bankCode ? ` — ${formData.bankCode}` : ""}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.variantId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.productName}{" "}
              <span className="text-foreground font-medium">({item.variantName})</span>
              {item.quantity > 1 && ` ×${item.quantity}`}
            </span>
            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Voucher */}
      <div className="p-3 rounded-xl border bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Kode Promo / Voucher</span>
        </div>
        {voucherId ? (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">{voucherCode}</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                -{formatPrice(discount)}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={removeVoucher}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && validateVoucher()}
              placeholder="MASUKKAN KODE"
              className="text-sm uppercase tracking-widest"
            />
            <Button size="sm" onClick={validateVoucher} disabled={validating || !voucherCode.trim()}>
              {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Pakai"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Diskon Voucher</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1 border-t">
          <span>Total</span>
          <span className="text-primary">{formatPrice(totalAfterDiscount)}</span>
        </div>
        {/* Xendit fee info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <Info className="h-3 w-3 shrink-0" />
          <span>{XENDIT_FEE[formData.paymentMethod]}</span>
        </div>
      </div>

      {/* Upsell */}
      {upsells.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-muted-foreground">Lengkapi dengan:</p>
          {upsells.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">Mulai {formatPrice(p.variants?.[0]?.price ?? 0)}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs">+ Tambah</Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={submitting}>
          Kembali
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => onSubmit(voucherId ?? undefined, discount > 0 ? discount : undefined)}
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Memproses...</>
          ) : (
            `Bayar ${formatPrice(totalAfterDiscount)}`
          )}
        </Button>
      </div>
    </div>
  )
}
