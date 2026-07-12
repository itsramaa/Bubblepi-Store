"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CheckoutFormData } from "@/types"

interface Props {
  onSubmit: (data: CheckoutFormData) => void
}

export default function CheckoutStep1({ onSubmit }: Props) {
  const [form, setForm] = useState({ customerName: "", customerEmail: "", paymentMethod: "QRIS" as "QRIS" | "VA", bankCode: "" as string })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Data Pembeli</h2>
      <div>
        <Label>Nama Lengkap</Label>
        <Input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nama kamu" />
      </div>
      <div>
        <Label>Email</Label>
        <Input required type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="email@contoh.com" />
      </div>
      <div>
        <Label>Metode Pembayaran</Label>
        <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as "QRIS" | "VA" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="QRIS">QRIS (GoPay, OVO, DANA, dll)</SelectItem>
            <SelectItem value="VA">Virtual Account</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.paymentMethod === "VA" && (
        <div>
          <Label>Bank</Label>
          <Select value={form.bankCode} onValueChange={(v) => setForm({ ...form, bankCode: (v as string) ?? "" })}>
            <SelectTrigger><SelectValue placeholder="Pilih bank" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BCA">BCA</SelectItem>
              <SelectItem value="BRI">BRI</SelectItem>
              <SelectItem value="BNI">BNI</SelectItem>
              <SelectItem value="PERMATA">Permata</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full">Lanjut ke Konfirmasi</Button>
    </form>
  )
}
