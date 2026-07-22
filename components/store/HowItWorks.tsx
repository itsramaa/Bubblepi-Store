import Link from "next/link"
import { ShoppingBag, CreditCard, Mail, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  {
    icon: ShoppingBag,
    number: "01",
    title: "Pilih Produk",
    desc: "Pilih layanan dan durasi yang kamu butuhkan. Tersedia opsi sharing maupun private.",
    micro: "700+ produk tersedia",
    gradient: "from-[#595B83] to-[#333456]",
  },
  {
    icon: Zap,
    number: "02",
    title: "Bayar Instan",
    desc: "Bayar via QRIS atau Virtual Account. Aman, cepat, tanpa perlu daftar akun.",
    micro: "QRIS, Transfer Bank, semua e-wallet",
    gradient: "from-[#F4ABC4] to-[#595B83]",
  },
  {
    icon: Mail,
    number: "03",
    title: "Terima di Email",
    desc: "Akun dikirim otomatis ke emailmu dalam hitungan menit. Langsung bisa dipakai!",
    micro: "Rata-rata < 5 menit",
    gradient: "from-[#333456] to-[#595B83]",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface-soft py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-caption text-primary mb-1 uppercase tracking-wider">Mudah & Cepat</p>
          <h2 className="text-display-xl mb-3">Cara Pembelian</h2>
          <p className="text-body-md text-muted max-w-md mx-auto">
            3 langkah simpel untuk mendapatkan akun premium impianmu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="group">
                {/* amenity-row style card */}
                <div className="bg-canvas border border-hairline rounded-md p-6 hover:shadow-card-hover transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-5xl font-black text-surface-strong leading-none select-none">
                      {step.number}
                    </span>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-title-md mb-2">{step.title}</h3>
                  <p className="text-body-sm text-muted leading-relaxed mb-3">{step.desc}</p>
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-caption rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {step.micro}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/products">
            <Button size="lg" className="btn-pill-glow bg-primary text-on-primary hover:bg-primary-active font-semibold px-8 gap-2 rounded-full">
              Mulai Belanja Sekarang <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-caption-sm text-muted mt-3">Tanpa daftar akun · Bayar langsung · Terima instan</p>
        </div>
      </div>
    </section>
  )
}