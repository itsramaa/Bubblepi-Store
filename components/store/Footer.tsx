import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Send, Lock } from "lucide-react"

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const footerLinks = {
  produk: [
    { label: "Semua Produk", href: "/products" },
    { label: "Streaming", href: "/products?category=streaming" },
    { label: "AI Tools", href: "/products?category=ai" },
    { label: "Design", href: "/products?category=design" },
    { label: "Gaming", href: "/products?category=gaming" },
  ],
  bantuan: [
    { label: "Lacak Pesanan", href: "/orders" },
    { label: "Cara Pembelian", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" },
    { label: "Garansi", href: "/#faq" },
  ],
}

const paymentMethods = ["QRIS", "BCA", "BRI", "BNI", "GoPay", "OVO", "DANA", "ShopeePay"]

export default function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Bubblepi" width={36} height={36} className="rounded-full" />
              <span className="font-bold text-xl">
                <span className="text-[#595B83]">Bubble</span>
                <span className="text-[#F4ABC4]">pi</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Toko akun digital premium terpercaya. Netflix, Spotify, Canva, dan banyak lagi dengan harga terjangkau.
            </p>

            {/* Dijamin Aman badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1.5 text-xs font-semibold mb-5">
              <Lock className="h-3.5 w-3.5" />
              Dijamin Aman & Terpercaya
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/6285179955480"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/bubblepii"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://t.me/bubblepii"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Produk */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Produk</h4>
            <ul className="space-y-2.5">
              {footerLinks.produk.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Bantuan</h4>
            <ul className="space-y-2.5">
              {footerLinks.bantuan.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Kontak</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                <div>
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <a href="https://wa.me/6285179955480" className="hover:text-foreground transition-colors">
                    +62 851-7995-5480
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Send className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <a href="mailto:bubbleppi@kawasan.digital" className="hover:text-foreground transition-colors">
                    bubbleppi@kawasan.digital
                  </a>
                </div>
              </li>
              <li className="mt-4 p-3 rounded-xl bg-muted/50 border text-xs leading-relaxed">
                🕐 Layanan pelanggan aktif<br />
                Senin–Minggu, 08.00–22.00 WIB
              </li>
            </ul>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-10 pt-8 border-t">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Metode Pembayaran</p>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="inline-flex items-center px-3 py-1 rounded-md bg-muted border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-emerald-500" />
            <p>© {new Date().getFullYear()} Bubblepi Store. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Syarat &amp; Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
