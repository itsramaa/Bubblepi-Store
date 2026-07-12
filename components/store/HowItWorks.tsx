import { ShoppingBag, CreditCard, Mail } from "lucide-react"

const steps = [
  {
    icon: ShoppingBag,
    number: "1",
    title: "Pilih Produk",
    desc: "Pilih produk dan varian yang kamu mau. Sharing atau private, ada garansi atau tidak.",
  },
  {
    icon: CreditCard,
    number: "2",
    title: "Bayar",
    desc: "Bayar via QRIS atau Virtual Account. Aman, cepat, tidak perlu daftar akun.",
  },
  {
    icon: Mail,
    number: "3",
    title: "Terima Akun",
    desc: "Akun dikirim otomatis ke email kamu. Tidak perlu tunggu lama.",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Cara Kerjanya</h2>
        <p className="text-muted-foreground mt-2">Beli akun digital dalam 3 langkah mudah</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="flex flex-col items-center text-center relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] right-[-50%] border-t-2 border-dashed border-muted-foreground/20 z-0" />
              )}
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F4ABC4]/20 to-[#595B83]/20 flex items-center justify-center mb-4 border border-[#F4ABC4]/30">
                <Icon className="h-7 w-7 text-[#595B83]" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#F4ABC4] to-[#595B83] text-white text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm max-w-[220px]">{step.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
