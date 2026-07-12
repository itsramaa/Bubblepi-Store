import Link from "next/link"
import Image from "next/image"
import { MessageCircle, ShoppingBag } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Bubblepi" width={32} height={32} className="rounded-full" />
              <span className="font-bold text-lg">Bubblepi</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium digital accounts marketplace. Akun berkualitas, harga bersahabat.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Produk</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products?category=streaming" className="hover:text-foreground transition-colors">Streaming</Link></li>
              <li><Link href="/products?category=ai" className="hover:text-foreground transition-colors">AI</Link></li>
              <li><Link href="/products?category=design" className="hover:text-foreground transition-colors">Design</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4">Bantuan</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><span className="cursor-default">Kebijakan Privasi</span></li>
              <li><span className="cursor-default">Syarat & Ketentuan</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4">Kontak</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>DM Instagram</span>
              </li>
              <li className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Shopee</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Bubblepi Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
