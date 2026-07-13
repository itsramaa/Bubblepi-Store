"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CheckoutFormData } from "@/types"
import { CreditCard, Smartphone, ChevronRight, Mail } from "lucide-react"
import { useCart } from "@/context/CartContext"

const BANKS = ["BCA", "BRI", "BNI", "PERMATA"]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const [emailError, setEmailError] = useState("")

  function validateEmail(email: string) {
    if (!email) return
    if (!EMAIL_RE.test(email)) {
      setEmailError("Format email tidak valid")
    } else {
      setEmailError("")
    }
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setForm({ ...form, customerEmail: val })
    if (emailError && EMAIL_RE.test(val)) setEmailError("")
  }

  function saveAbandonedCart() {
    validateEmail(form.customerEmail)
    if (!form.customerEmail || !form.customerName || items.length === 0) return
    fetch("/api/cart/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.customerEmail, name: form.customerName, items }),
    }).catch(() => {})
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(form.customerEmail)) {
      setEmailError("Format email tidak valid")
      return
    }
    onSubmit(form)
  }

  const emailValid = EMAIL_RE.test(form.customerEmail)

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
            autoComplete="name"
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
            autoComplete="email"
            value={form.customerEmail}
            onChange={handleEmailChange}
            onBlur={saveAbandonedCart}
            placeholder="email@contoh.com"
            className={cn(emailError && "border-destructive focus-visible:ring-destructive")}
          />
          {emailError ? (
            <p className="text-xs text-destructive flex items-center gap-1">⚠ {emailError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Credentials akun akan dikirim ke email ini.</p>
          )}
        </div>

        {/* Real-time delivery confirmation box */}
        {emailValid && form.customerEmail && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">Akun akan dikirim ke:</p>
              <p className="text-sm font-semibold truncate">{form.customerEmail}</p>
            </div>
          </div>
        )}
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
                form.paymentMethod === method
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                form.paymentMethod === method
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {method === "QRIS" ? <Smartphone className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium text-sm">{method}</p>
                {method === "QRIS" ? (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"].map(m => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{m}</span>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {["BCA", "BRI", "Mandiri", "BNI", "BSI"].map(b => (
                      <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{b}</span>
                    ))}
                  </div>
                )}
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
                  form.bankCode === bank
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full gap-2"
        disabled={form.paymentMethod === "VA" && !form.bankCode}
      >
        Lanjut ke Konfirmasi
        <ChevronRight className="h-4 w-4" />
      </Button>
    </form>
  )
}
