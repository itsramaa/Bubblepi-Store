"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  { q: "Apa itu akun sharing?", a: "Akun sharing adalah akun premium yang dipakai bersama beberapa orang. Harga lebih murah karena dibagi, tapi kualitas tetap premium." },
  { q: "Berapa lama proses pengiriman?", a: "Setelah pembayaran terverifikasi, akun dikirim otomatis ke email kamu dalam 1–5 menit." },
  { q: "Ada garansi?", a: "Ya, setiap pembelian termasuk garansi 1 bulan. Jika ada masalah, DM admin dan langsung diproses." },
  { q: "Pembayaran apa saja yang tersedia?", a: "QRIS (GoPay, OVO, DANA, ShopeePay, dll) dan Virtual Account (BCA, BRI, BNI, Permata)." },
  { q: "Bisa ganti password akun?", a: "Untuk akun sharing, TIDAK boleh ganti password karena dipakai bersama. Untuk akun private, kamu bebas ganti setelah diterima." },
]

export default function FAQSection() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <section className="max-w-3xl mx-auto px-4 py-20" id="faq">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Pertanyaan Umum</h2>
          <p className="text-muted-foreground mt-2">Ada yang kurang jelas? Cek dulu di sini</p>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border rounded-xl px-2 data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline py-4 px-2">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-2 pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  )
}
