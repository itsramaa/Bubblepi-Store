import { ShoppingBag, CreditCard, Mail, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: ShoppingBag,
    number: "01",
    title: "Pilih Produk",
    desc: "Pilih layanan dan durasi yang kamu butuhkan. Tersedia opsi sharing maupun private.",
    color: "from-[#595B83] to-[#333456]",
  },
  {
    icon: CreditCard,
    number: "02",
    title: "Bayar Instan",
    desc: "Bayar via QRIS atau Virtual Account. Aman, cepat, tanpa perlu daftar akun.",
    color: "from-[#F4ABC4] to-[#595B83]",
  },
  {
    icon: Mail,
    number: "03",
    title: "Terima di Email",
    desc: "Akun dikirim otomatis ke emailmu dalam hitungan menit. Langsung bisa dipakai!",
    color: "from-[#333456] to-[#595B83]",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">Mudah & Cepat</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Cara Pembelian</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            3 langkah simpel untuk mendapatkan akun premium impianmu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-[#595B83] to-[#F4ABC4] z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative z-10 flex flex-col items-center text-center group">
                {/* Step card */}
                <div className="w-full bg-card border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  {/* Number + icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-5xl font-black text-muted/40 leading-none select-none">
                      {step.number}
                    </span>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>

                {/* Arrow between steps (mobile) */}
                {i < steps.length - 1 && (
                  <div className="md:hidden my-3 text-muted-foreground">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
