"use client"

import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface StockInfo {
  [variantId: string]: number
}

interface CrossSellProduct {
  id: string
  name: string
  slug: string
  variants: {
    id: string
    name: string
    duration: string
    price: number
  }[]
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, getItemCount } = useCart()
  const [stockMap, setStockMap] = useState<StockInfo>({})
  const [crossSellProducts, setCrossSellProducts] = useState<CrossSellProduct[]>([])

  // Fetch stock counts for cart items
  useEffect(() => {
    if (items.length === 0) return
    const variantIds = items.map((i) => i.variantId)
    fetch(`/api/products/stock?ids=${variantIds.join(",")}`)
      .then((r) => r.json())
      .then((data: StockInfo) => setStockMap(data))
      .catch(() => {})
  }, [items])

  // Fetch cross-sell products — exclude all cart product ids
  useEffect(() => {
    if (items.length === 0) return
    const firstProductId = items[0]?.productId ?? ""
    fetch(`/api/products/upsell?excludeId=${encodeURIComponent(firstProductId)}`)
      .then((r) => r.json())
      .then((data: { products: CrossSellProduct[] }) => setCrossSellProducts((data.products ?? []).slice(0, 3)))
      .catch(() => {})
  }, [items])

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-7xl" role="img" aria-label="keranjang">
            🛒
          </span>
          <h1 className="text-2xl font-bold">Keranjangmu masih kosong</h1>
          <p className="text-muted-foreground max-w-sm">
            Belum ada produk di keranjang. Mulai jelajahi akun digital premium kami!
          </p>
          <Link href="/products">
            <Button className="gap-2 mt-2">
              Mulai Belanja
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const hasDiscount = total < subtotal

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Keranjang</h1>
      <p className="text-muted-foreground mb-8">{getItemCount()} item dipilih</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const stock = stockMap[item.variantId]
            const atLimit = stock !== undefined && item.quantity >= stock
            // Show warning when only 1 or fewer units remain beyond current qty
            const nearLimit = stock !== undefined && stock > 0 && stock - item.quantity <= 1

            return (
              <div
                key={item.variantId}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 transition-colors"
              >
                {/* Initial-based avatar */}
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {item.productName.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">{item.variantName} • {item.duration}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(item.price)}</p>
                  {stock !== undefined && nearLimit && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Stok tersisa {Math.max(stock - item.quantity, 0)}
                    </p>
                  )}
                </div>

                {/* Quantity + delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-l-lg rounded-r-none"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-r-lg rounded-l-none disabled:opacity-40"
                      disabled={atLimit}
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.variantId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({getItemCount()} item)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Diskon
                    </span>
                    <span>-{formatPrice(subtotal - total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Biaya Xendit</span>
                  <span>Dihitung saat checkout</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <Link href="/checkout" className="block mt-2">
                <Button className="w-full gap-2">
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button variant="ghost" className="w-full text-sm">
                  Lanjut Belanja
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cross-sell section */}
      {crossSellProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Sering dibeli bareng</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {crossSellProducts.map((product) => {
              const cheapest = product.variants[0]
              return (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="border rounded-xl p-4 bg-card hover:border-primary/30 transition-colors">
                    <div className="w-full aspect-[4/3] rounded-lg bg-primary/5 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-primary/60">
                        {product.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    {cheapest && (
                      <>
                        <p className="text-xs text-muted-foreground">{cheapest.duration}</p>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(cheapest.price)}</p>
                      </>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
