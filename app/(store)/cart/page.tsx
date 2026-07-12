"use client"

import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTax, getTotal, getItemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Keranjang Kosong</h1>
          <p className="text-muted-foreground max-w-sm">
            Belum ada produk di keranjang. Yuk mulai belanja akun digital premium!
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Keranjang</h1>
      <p className="text-muted-foreground mb-8">{getItemCount()} item dipilih</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 transition-colors"
            >
              {/* Icon placeholder */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.productName}</p>
                <p className="text-sm text-muted-foreground">{item.variantName} • {item.duration}</p>
                <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(item.price)}</p>
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
                    className="h-8 w-8 rounded-r-lg rounded-l-none"
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
          ))}
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
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>PPN 11%</span>
                  <span>{formatPrice(getTax())}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(getTotal())}</span>
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
    </div>
  )
}
