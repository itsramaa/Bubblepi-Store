import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-background mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-cal text-lg font-bold text-primary">Bubblepi Store</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Premium digital accounts with affordable prices.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Links</h4>
            <div className="flex flex-col gap-1 text-sm">
              <Link href="/" className="hover:text-primary">Home</Link>
              <Link href="/products" className="hover:text-primary">Produk</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Kontak</h4>
            <p className="text-sm text-muted-foreground">support@bubblepi.store</p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          © 2026 Bubblepi Store. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
