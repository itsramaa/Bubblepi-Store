"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  { q: "Apa itu akun sharing?", a: "Akun sharing adalah akun premium yang dipakai bersama beberapa orang. Harga jadi lebih murah karena dibagi." },
  { q: "Berapa lama proses pengiriman?", a: "Setelah pembayaran terverifikasi, akun dikirim otomatis ke email kamu dalam 1-5 menit." },
  { q: "Ada garansi?", a: "Ya, setiap pembelian termasuk garansi 1 bulan. Jika ada masalah, DM admin." },
  { q: "Pembayaran apa saja?", a: "QRIS (semua e-wallet) dan Virtual Account (BCA, BRI, BNI, Permata)." },
  { q: "Bisa ganti password akun?", a: "Untuk akun sharing, TIDAK boleh ganti password. Untuk akun private, silakan ganti setelah diterima." },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold mb-8 text-center">FAQ</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border rounded-lg">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex items-center justify-between w-full px-4 py-3 text-left font-medium"
            >
              {faq.q}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open === i && "rotate-180"
                )}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-3 text-sm text-muted-foreground">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
