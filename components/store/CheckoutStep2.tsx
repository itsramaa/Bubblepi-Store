"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Loader2, Gift, Tag, X, Info, Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import type { CheckoutFormData } from "@/types"
import { goAPI } from "@/lib/api-client"
import { useRouter } from "next/navigation"

interface Props {
  formData: CheckoutFormData
  onSubmit: (voucherId?: string, discountAmount?: number) => void
  onBack: () => void
  submitting?: boolean
}

const XENDIT_FEE: Record<string, string> = {
  QRIS: "Biaya QRIS: 0.7% (ditanggung Xendit)",
  VA: "Biaya VA: Rp 4.000 (ditanggung Xendit)",
}

export default function CheckoutStep2({ formData, onSubmit, onBack, submitting = false }: Props) {
  const { items, getSubtotal } = useCart()
  const router = useRouter()
  const [voucherCode, setVoucherCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [voucherId, setVoucherId] = useState<string | null>(null)
  const [voucherError, setVoucherError] = useState("")
  const [validating, setValidating] = useState(false)
  const [upsells, setUpsells] = useState<Array<{
    id: string
    name: string
    images: string[]
    variants: Array<{ id: string; name: string; price: number; duration?: string }>
  }>>([])

  const subtotal = getSubtotal()
  const totalAfterDiscount = Math.max(subtotal - discount, 0)

  useEffect(() => {
    if (items.length > 0) {
      fetch(goAPI(`/api/products/upsell?excludeId=${items[0].productId}`), { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setUpsells(d.products || []))
        .catch(() => {})
    }
  }, [items])

  async function validateVoucher() {
    if (!voucherCode.trim()) return
    setValidating(true)
    setVoucherError("")
    try {
      const res = await fetch(goAPI("/api/vouchers/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, cartTotal: subtotal }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDiscount(data.discount)
      setVoucherId(data.voucherId)
      toast.success(`Voucher berhasil! Hemat ${formatPrice(data.discount)}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Voucher tidak valid"
      setVoucherError(msg)
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
    setVoucherError("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title-md mb-1">Konfirmasi Pesanan</h2>
        <p className="text-body-sm text-muted">Pastikan semua data sudah benar.</p>
      </div>

      {/* Customer info — host-card style */}
      <div className="card-host border border-hairline">
        <div className="flex justify-between gap-2 text-body-sm">
          <span className="text-muted shrink-0">Nama</span>
          <span className="font-medium text-right">{formData.customerName}</span>
        </div>
        <div className="flex justify-between gap-2 text-body-sm mt-1.5">
          <span className="text-muted shrink-0">Email</span>
          <span className="font-medium break-all text-right">{formData.customerEmail}</span>
        </div>
        <div className="flex justify-between gap-2 text-body-sm mt-1.5">
          <span className="text-muted shrink-0">Metode Bayar</span>
          <span className="font-medium text-right">
            {formData.paymentMethod}{formData.bankCode ? ` — ${formData.bankCode}` : ""}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <p className="text-caption text-muted">Produk yang dibeli</p>
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex items-center gap-3 rounded-md border border-hairline bg-card p-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-caption font-bold text-primary shrink-0">
              {item.productName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold truncate">{item.productName}</p>
              <p className="text-caption-sm text-muted">{item.variantName}</p>
            </div>
            <div className="text-right shrink-0">
              {item.quantity > 1 && (
                <p className="text-caption-sm text-muted">{item.quantity}× {formatPrice(item.price)}</p>
              )}
              <p className="text-body-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Voucher */}
      <div className="p-3 rounded-md border border-hairline bg-surface-soft">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-body-sm font-medium">Kode Promo / Voucher</span>
        </div>
        {voucherId ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-3 py-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-body-sm font-medium text-green-700">{voucherCode}</span>
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5">
                -{formatPrice(discount)}
              </span>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted" onClick={removeVoucher}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                value={voucherCode}
                onChange={(e) => {
                  setVoucherCode(e.target.value.toUpperCase())
                  if (voucherError) setVoucherError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && validateVoucher()}
                placeholder="MASUKKAN KODE"
                className={`text-body-sm uppercase tracking-widest ${voucherError ? "border-destructive" : ""}`}
              />
              <Button size="sm" onClick={validateVoucher} disabled={validating || !voucherCode.trim()}>
                {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Pakai"}
              </Button>
            </div>
            {voucherError && (
              <p className="flex items-center gap-1 text-caption-sm text-destructive">
                <X className="h-3 w-3 shrink-0" />
                {voucherError}
              </p>
            )}
          </div>
        )}
      </div>

      <Separator className="bg-hairline" />

      {/* Summary */}
      <div className="space-y-1.5 text-body-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Diskon Voucher</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-title-md pt-1 border-t border-hairline">
          <span>Total</span>
          <span className="text-primary">{formatPrice(totalAfterDiscount)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-caption-sm text-muted pt-1">
          <Info className="h-3 w-3 shrink-0" />
          <span>{XENDIT_FEE[formData.paymentMethod]}</span>
        </div>
      </div>

      {/* Upsell */}
      {upsells.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-caption text-muted">Lengkapi dengan:</p>
          {upsells.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-md border border-hairline">
              <div>
                <p className="text-body-sm font-medium">{p.name}</p>
                <p className="text-caption-sm text-muted">Mulai {formatPrice(p.variants?.[0]?.price ?? 0)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-caption"
                onClick={() => router.push(`/products/${p.id}`)}
              >
                + Tambah
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="outline" className="flex-1 w-full sm:w-auto" onClick={onBack} disabled={submitting}>
          Kembali
        </Button>
        <Button
          className="flex-1 gap-2 btn-primary"
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

      {/* Trust badge */}
      <div className="flex items-center justify-center gap-1.5 text-caption-sm text-muted">
        <Lock className="h-3 w-3 shrink-0" />
        <span>Dijamin aman · Diproses otomatis · Enkripsi SSL</span>
        <ShieldCheck className="h-3 w-3 shrink-0 text-green-500" />
      </div>
    </div>
  )
}