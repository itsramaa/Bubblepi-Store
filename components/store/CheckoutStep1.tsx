"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CheckoutFormData } from "@/types"
import { CreditCard, Smartphone, ChevronRight } from "lucide-react"
import { useCart } from "@/context/CartContext"

const BANKS = ["BCA", "BRI", "BNI", "PERMATA"]

interface Props {
  onSubmit: (data: CheckoutFormData) => void
}

export default function CheckoutStep1({ onSubmit }: Props) {
  const { items } = useCart()
  const [form, setForm] = useState<CheckoutFormData>({
    customerName: "",
    customerEmail: "",
    paymentMethod: "QRIS",
    bankCode: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  function saveAbandonedCart() {
    if (!form.customerEmail || !form.customerName || items.length === 0) return
    fetch("/api/cart/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.customerEmail, name: form.customerName, items }),
    }).catch(() => {})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data Pembeli</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Akun akan dikirim ke email ini.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            required
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            placeholder="Nama kamu"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            required
            type="email"
            value={form.customerEmail}
            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            onBlur={saveAbandonedCart}
            placeholder="email@contoh.com"
          />
          <p className="text-xs text-muted-foreground">Credentials akun akan dikirim ke email ini.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["QRIS", "VA"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setForm({ ...form, paymentMethod: method, bankCode: "" })}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                form.paymentMethod === method ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                form.paymentMethod === method ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {method === "QRIS" ? <Smartphone className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium text-sm">{method}</p>
                <p className="text-xs text-muted-foreground">{method === "QRIS" ? "GoPay, OVO, DANA" : "BCA, BRI, BNI"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {form.paymentMethod === "VA" && (
        <div className="space-y-2">
          <Label>Pilih Bank</Label>
          <div className="grid grid-cols-2 gap-2">
            {BANKS.map((bank) => (
              <button
                key={bank}
                type="button"
                onClick={() => setForm({ ...form, bankCode: bank })}
                className={cn(
                  "py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all",
                  form.bankCode === bank ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30"
                )}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={form.paymentMethod === "VA" && !form.bankCode}>
        Lanjut ke Konfirmasi
        <ChevronRight className="h-4 w-4" />
      </Button>
    </form>
  )
}
