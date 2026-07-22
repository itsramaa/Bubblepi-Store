"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CheckoutFormData } from "@/types"
import { CreditCard, Smartphone, ChevronRight, Mail } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { goAPI } from "@/lib/api-client"

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
    validateEmail(form.customerEmail ?? "")
    if (!form.customerEmail || !form.customerName || items.length === 0) return
    fetch(goAPI("/api/cart/save"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.customerEmail, name: form.customerName, items }),
      credentials: "include",
    }).catch(() => {})
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerEmail || !EMAIL_RE.test(form.customerEmail)) {
      setEmailError("Format email tidak valid")
      return
    }
    onSubmit({
      ...form,
      guestName: form.customerName,
      guestEmail: form.customerEmail,
    })
  }

  const emailValid = form.customerEmail ? EMAIL_RE.test(form.customerEmail) : false

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-title-md">Data Pembeli</h2>
        <p className="text-body-sm text-muted mt-0.5">Akun akan dikirim ke email ini.</p>
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
            className={cn(emailError && "border-destructive")}
          />
          {emailError ? (
            <p className="text-caption-sm text-destructive">{emailError}</p>
          ) : (
            <p className="text-caption-sm text-muted">Credentials akun akan dikirim ke email ini.</p>
          )}
        </div>

        {/* Real-time delivery confirmation */}
        {emailValid && form.customerEmail && (
          <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-caption-sm font-medium text-primary">Akun akan dikirim ke:</p>
              <p className="text-body-sm font-semibold truncate">{form.customerEmail}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method — reservation-card style */}
      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, paymentMethod: "QRIS", bankCode: "" })}
            className={cn(
              "flex items-center gap-3 p-4 rounded-md border text-left transition-all",
              form.paymentMethod === "QRIS"
                ? "border-ink bg-surface-soft"
                : "border-hairline hover:border-muted"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
              form.paymentMethod === "QRIS"
                ? "bg-ink text-on-dark"
                : "bg-surface-strong text-muted"
            )}>
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-body-sm font-medium">QRIS</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"].map(m => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-strong text-muted font-medium">{m}</span>
                ))}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, paymentMethod: "VIRTUAL_ACCOUNT", bankCode: "" })}
            className={cn(
              "flex items-center gap-3 p-4 rounded-md border text-left transition-all",
              form.paymentMethod === "VIRTUAL_ACCOUNT"
                ? "border-ink bg-surface-soft"
                : "border-hairline hover:border-muted"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
              form.paymentMethod === "VIRTUAL_ACCOUNT"
                ? "bg-ink text-on-dark"
                : "bg-surface-strong text-muted"
            )}>
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-body-sm font-medium">Virtual Account</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {["BCA", "BRI", "Mandiri", "BNI", "BSI"].map(b => (
                  <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-strong text-muted font-medium">{b}</span>
                ))}
              </div>
            </div>
          </button>
        </div>
      </div>

      {form.paymentMethod === "VIRTUAL_ACCOUNT" && (
        <div className="space-y-2">
          <Label>Pilih Bank</Label>
          <div className="grid grid-cols-2 gap-2">
            {BANKS.map((bank) => (
              <button
                key={bank}
                type="button"
                onClick={() => setForm({ ...form, bankCode: bank })}
                className={cn(
                  "py-2.5 px-4 rounded-sm border text-body-sm font-medium transition-all",
                  form.bankCode === bank
                    ? "border-ink bg-surface-soft text-ink"
                    : "border-hairline hover:border-muted"
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
        className="w-full gap-2 btn-primary"
        disabled={form.paymentMethod === "VIRTUAL_ACCOUNT" && !form.bankCode}
      >
        Lanjut ke Konfirmasi
        <ChevronRight className="h-4 w-4" />
      </Button>
    </form>
  )
}